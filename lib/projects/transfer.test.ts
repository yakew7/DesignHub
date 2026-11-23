import { describe, expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { MAX_VERSIONS, type ProjectVersion, type VersionReason } from "@/lib/projects/history";
import {
  archiveFileName,
  importedVersions,
  parseProjectsFile,
  previewEntries,
  projectsToJson,
  projectToJson,
} from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";

function project(name: string, patch: Partial<BrandProject> = {}): BrandProject {
  return {
    id: `id-${name}`,
    favorite: false,
    tags: [],
    createdAt: 1,
    updatedAt: 2,
    lastOpenedAt: 3,
    snapshot: defaultSnapshot(name),
    ...patch,
  };
}

const evilSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script>' +
  '<foreignObject><div>x</div></foreignObject><a href="javascript:alert(3)"><rect width="10" height="10"/></a></svg>';

describe("project files", () => {
  test("a single project round-trips", () => {
    const original = project("Acme", { favorite: true });
    const [entry] = parseProjectsFile(projectToJson(original));
    expect(entry?.favorite).toBe(true);
    expect(entry?.snapshot.brand.profile.name).toBe("Acme");
    expect(entry?.snapshot.colors.swatches).toEqual(original.snapshot.colors.swatches);
  });

  test("a multi-project file returns every entry", () => {
    const entries = parseProjectsFile(projectsToJson([project("One"), project("Two"), project("Three")]));
    expect(entries.map((entry) => entry.snapshot.brand.profile.name)).toEqual(["One", "Two", "Three"]);
  });

  test("missing slices are filled from the defaults", () => {
    // An older file without the social and effects slices.
    const partial: Record<string, unknown> = { ...defaultSnapshot("Old") };
    delete partial.social;
    delete partial.effects;
    const [entry] = parseProjectsFile(JSON.stringify({ format: "designhub.project", version: 1, snapshot: partial }));
    expect(entry?.snapshot.social.design).toEqual(defaultSnapshot().social.design);
    expect(entry?.snapshot.effects.settings).toEqual(defaultSnapshot().effects.settings);
  });

  test("the mission and values round-trip", () => {
    const original = project("Acme");
    original.snapshot.brand.profile.mission = {
      statement: "Make brands easy.",
      values: [{ title: "Speed", description: "Ship small, ship often." }],
    };
    const [entry] = parseProjectsFile(projectToJson(original));
    expect(entry?.snapshot.brand.profile.mission).toEqual(original.snapshot.brand.profile.mission);
  });

  test("an older file without a mission gets the default, and bad values are dropped", () => {
    const old = defaultSnapshot("Old");
    const profile: Record<string, unknown> = { ...old.brand.profile };
    delete profile.mission;
    const [entry] = parseProjectsFile(
      JSON.stringify({ format: "designhub.project", version: 1, snapshot: { ...old, brand: { profile } } }),
    );
    expect(entry?.snapshot.brand.profile.mission).toEqual(defaultSnapshot().brand.profile.mission);

    const messy = defaultSnapshot("Messy");
    const values = [
      { title: "Ok", description: "Fine" },
      { title: 3 },
      "nope",
      ...Array(6).fill({ title: "A", description: "B" }),
    ];
    const brand = { profile: { ...messy.brand.profile, mission: { statement: 7, values } } };
    const [parsed] = parseProjectsFile(
      JSON.stringify({ format: "designhub.project", version: 1, snapshot: { ...messy, brand } }),
    );
    expect(parsed?.snapshot.brand.profile.mission.statement).toBe(defaultSnapshot().brand.profile.mission.statement);
    expect(parsed?.snapshot.brand.profile.mission.values).toHaveLength(4);
    expect(parsed?.snapshot.brand.profile.mission.values[0]).toEqual({ title: "Ok", description: "Fine" });
  });

  test("names are trimmed to 60 characters", () => {
    const long = project("x".repeat(100));
    const [entry] = parseProjectsFile(projectToJson(long));
    expect(entry?.snapshot.brand.profile.name).toHaveLength(60);
  });
});

describe("tags", () => {
  test("round-trip in single and multi-project files", () => {
    const tagged = project("Acme", { tags: ["client", "archived"] });
    expect(parseProjectsFile(projectToJson(tagged))[0]?.tags).toEqual(["client", "archived"]);
    const entries = parseProjectsFile(projectsToJson([tagged, project("Plain")]));
    expect(entries.map((entry) => entry.tags)).toEqual([["client", "archived"], []]);
  });

  test("an older file without tags imports with none", () => {
    const old = { format: "designhub.project", version: 1, favorite: true, snapshot: defaultSnapshot("Old") };
    const [entry] = parseProjectsFile(JSON.stringify(old));
    expect(entry?.tags).toEqual([]);
    expect(entry?.favorite).toBe(true);
    const list = { format: "designhub.projects", version: 1, projects: [{ snapshot: defaultSnapshot("Old") }] };
    expect(parseProjectsFile(JSON.stringify(list))[0]?.tags).toEqual([]);
  });

  test("are trimmed, lowercased, deduplicated and capped at five", () => {
    const tags = [
      "  Client ",
      "client",
      "",
      "   ",
      42,
      null,
      "Very   long tag name that keeps going",
      "a",
      "b",
      "c",
      "d",
    ];
    const file = { format: "designhub.project", version: 1, tags, snapshot: defaultSnapshot("Messy") };
    const [entry] = parseProjectsFile(JSON.stringify(file));
    expect(entry?.tags).toEqual(["client", "very long tag name that", "a", "b", "c"]);
  });

  test("a value that isn't a list is ignored", () => {
    const file = { format: "designhub.project", version: 1, tags: "client", snapshot: defaultSnapshot("Odd") };
    expect(parseProjectsFile(JSON.stringify(file))[0]?.tags).toEqual([]);
  });
});

describe("untrusted logos are sanitized", () => {
  function withLogos() {
    const snapshot = defaultSnapshot("Evil");
    snapshot.brand.profile.logoSvg = evilSvg;
    snapshot.social.design.logoSvg = evilSvg;
    return JSON.stringify({ format: "designhub.project", version: 1, snapshot });
  }

  test.each([
    ["brand logo", (e: ReturnType<typeof parseProjectsFile>[number]) => e.snapshot.brand.profile.logoSvg],
    ["social logo", (e: ReturnType<typeof parseProjectsFile>[number]) => e.snapshot.social.design.logoSvg],
  ])("%s", (_label, pick) => {
    const [entry] = parseProjectsFile(withLogos());
    const logo = pick(entry!) ?? "";
    expect(logo).toContain("<rect");
    expect(logo).not.toMatch(/<script|onload=|<foreignObject|javascript:/i);
  });

  test("a logo that isn't SVG is dropped", () => {
    const snapshot = defaultSnapshot("Broken");
    snapshot.brand.profile.logoSvg = "not svg at all";
    const [entry] = parseProjectsFile(JSON.stringify({ format: "designhub.project", version: 1, snapshot }));
    expect(entry?.snapshot.brand.profile.logoSvg).toBeNull();
  });
});

describe("invalid files throw a readable error", () => {
  test.each([
    ["invalid JSON", "{nope", /valid JSON/],
    ["the wrong format", JSON.stringify({ format: "something-else" }), /isn't a DesignHub project/],
    ["a Brand JSON export", JSON.stringify({ format: "designhub.brand" }), /Brand JSON/],
    ["a missing snapshot", JSON.stringify({ format: "designhub.project" }), /no brand data/],
  ])("%s", (_label, text, message) => {
    expect(() => parseProjectsFile(text)).toThrow(message);
  });

  test("fewer than 2 swatches", () => {
    const snapshot = defaultSnapshot("Tiny");
    snapshot.colors.swatches = snapshot.colors.swatches.slice(0, 1);
    expect(() => parseProjectsFile(JSON.stringify({ format: "designhub.project", snapshot }))).toThrow(/palette/);
  });

  test("a missing brand name", () => {
    const snapshot = defaultSnapshot();
    const broken = { ...snapshot, brand: { profile: { ...snapshot.brand.profile, name: 42 } } };
    expect(() => parseProjectsFile(JSON.stringify({ format: "designhub.project", snapshot: broken }))).toThrow(/name/);
  });
});

describe("version history", () => {
  function version(id: string, createdAt: number, name: string, reason: VersionReason = "autosave"): ProjectVersion {
    return { id, projectId: "id-Acme", createdAt, reason, snapshot: defaultSnapshot(name) };
  }

  test("is left out unless asked for, and files without it import with none", () => {
    const original = project("Acme");
    expect(JSON.parse(projectToJson(original))).not.toHaveProperty("history");
    expect(parseProjectsFile(projectToJson(original))[0]?.history).toEqual([]);
    expect(parseProjectsFile(projectsToJson([original]))[0]?.history).toEqual([]);
  });

  test("round-trips a single project and a project list, newest first, with fresh ids", () => {
    const original = project("Acme");
    const versions = [version("v1", 100, "Acme v1", "palette"), version("v2", 200, "Acme v2")];
    const [entry] = parseProjectsFile(projectToJson(original, versions));
    expect(entry?.history.map((item) => [item.createdAt, item.reason, item.snapshot.brand.profile.name])).toEqual([
      [200, "autosave", "Acme v2"],
      [100, "palette", "Acme v1"],
    ]);
    expect(entry?.history[0]?.snapshot.colors.swatches).toEqual(versions[1]?.snapshot.colors.swatches);
    expect(JSON.stringify(entry)).not.toContain("id-Acme");

    let n = 0;
    const imported = importedVersions("new-project", entry?.history ?? [], () => `fresh-${++n}`);
    expect(imported.map((item) => [item.id, item.projectId, item.createdAt])).toEqual([
      ["fresh-1", "new-project", 200],
      ["fresh-2", "new-project", 100],
    ]);

    const other = project("Other");
    const histories = new Map([[original.id, versions]]);
    const entries = parseProjectsFile(projectsToJson([original, other], histories));
    expect(entries.map((item) => item.history.length)).toEqual([2, 0]);
  });

  test("drops a tampered version and keeps the rest", () => {
    const file = JSON.parse(projectToJson(project("Acme"), [version("v1", 100, "Good"), version("v2", 200, "Bad")]));
    file.history[0].snapshot.colors.swatches = [];
    file.history.push({ createdAt: 300, reason: "hacked", snapshot: defaultSnapshot("Unknown reason") });
    file.history.push({ createdAt: "soon", reason: "autosave", snapshot: defaultSnapshot("Bad date") });
    file.history.push("not a version");
    const [entry] = parseProjectsFile(JSON.stringify(file));
    expect(entry?.snapshot.brand.profile.name).toBe("Acme");
    expect(entry?.history.map((item) => item.snapshot.brand.profile.name)).toEqual(["Good"]);
  });

  test("re-sanitizes logos in versions and caps them at the newest MAX_VERSIONS", () => {
    const evil = version("evil", 5_000, "Evil");
    evil.snapshot.brand.profile.logoSvg = evilSvg;
    const many = Array.from({ length: MAX_VERSIONS + 5 }, (_, i) => version(`v${i}`, i, `V${i}`));
    const file = JSON.parse(projectToJson(project("Acme"), [evil]));
    file.history.push(...many.map(({ createdAt, reason, snapshot }) => ({ createdAt, reason, snapshot })));
    const history = parseProjectsFile(JSON.stringify(file))[0]?.history ?? [];
    expect(history).toHaveLength(MAX_VERSIONS);
    expect(history[0]?.snapshot.brand.profile.name).toBe("Evil");
    expect(history[0]?.snapshot.brand.profile.logoSvg).not.toMatch(/<script|onload=|<foreignObject|javascript:/i);
    expect(history[history.length - 1]?.createdAt).toBe(6);
  });
});

describe("archive file", () => {
  const version = (id: string, createdAt: number, name: string): ProjectVersion => ({
    id,
    projectId: "any",
    createdAt,
    reason: "autosave",
    snapshot: defaultSnapshot(name),
  });

  test("is named for the day it was made, in UTC", () => {
    expect(archiveFileName(new Date("2026-11-21T23:59:59Z"))).toBe("designhub-archive-2026-11-21.json");
  });

  test("holds each archived project with its history and reads back as the same projects", () => {
    const first = project("First", { tags: ["old"] });
    const second = project("Second", { favorite: true });
    const histories = new Map([
      [first.id, [version("a", 10, "A"), version("b", 20, "B")]],
      [second.id, [version("c", 30, "C")]],
    ]);
    const entries = parseProjectsFile(projectsToJson([first, second], histories));
    expect(entries.map((entry) => entry.snapshot.brand.profile.name)).toEqual(["First", "Second"]);
    expect(entries.map((entry) => entry.history.length)).toEqual([2, 1]);
    expect(entries[0]?.tags).toEqual(["old"]);
    expect(entries[1]?.favorite).toBe(true);
  });

  test("previews each project of a file: name, tags, number of versions and size", () => {
    const first = project("First", { tags: ["old", "client"] });
    const second = project("Second");
    const histories = new Map([[first.id, [version("a", 10, "A"), version("b", 20, "B")]]]);
    const entries = parseProjectsFile(projectsToJson([first, second], histories));
    const preview = previewEntries(entries);
    expect(preview.map((item) => [item.name, item.tags, item.versions])).toEqual([
      ["First", ["old", "client"], 2],
      ["Second", [], 0],
    ]);
    // The one with history is larger than the one without, and a size is a whole number of bytes.
    expect(preview[0]!.bytes).toBeGreaterThan(preview[1]!.bytes);
    expect(Number.isInteger(preview[1]!.bytes) && preview[1]!.bytes > 0).toBe(true);
  });
});
