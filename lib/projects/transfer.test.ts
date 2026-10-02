import { describe, expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { parseProjectsFile, projectsToJson, projectToJson } from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";

function project(name: string, patch: Partial<BrandProject> = {}): BrandProject {
  return {
    id: `id-${name}`,
    favorite: false,
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
