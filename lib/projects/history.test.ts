import { describe, expect, test } from "vitest";

import { autoVersionDue, MAX_VERSIONS, planVersion, sameSnapshot, type ProjectVersion } from "@/lib/projects/history";
import { defaultSnapshot, type BrandSnapshot } from "@/lib/projects/snapshot";

function version(id: string, createdAt: number, snapshot: BrandSnapshot = defaultSnapshot(id)): ProjectVersion {
  return { id, projectId: "p1", createdAt, reason: "autosave", snapshot };
}

describe("version history", () => {
  test("the first version is always kept", () => {
    const plan = planVersion([], version("a", 1));
    expect(plan?.keep.map((item) => item.id)).toEqual(["a"]);
    expect(plan?.drop).toEqual([]);
  });

  test("a snapshot identical to the newest version is skipped", () => {
    const existing = [version("old", 1, defaultSnapshot("Same"))];
    expect(planVersion(existing, version("new", 2, defaultSnapshot("Same")))).toBeNull();
  });

  test("identical snapshots match whatever their key order", () => {
    const a = defaultSnapshot("Acme");
    const { version: v, ...rest } = a;
    const reordered = { ...rest, version: v } as BrandSnapshot;
    expect(sameSnapshot(a, reordered)).toBe(true);
    expect(sameSnapshot(a, defaultSnapshot("Other"))).toBe(false);
  });

  test("only the newest version counts as a duplicate", () => {
    // Going back to an older state is a real change and gets its own version.
    const existing = [version("a", 1, defaultSnapshot("A")), version("b", 2, defaultSnapshot("B"))];
    const plan = planVersion(existing, version("c", 3, defaultSnapshot("A")));
    expect(plan?.keep.map((item) => item.id)).toEqual(["c", "b", "a"]);
  });

  test("history is capped, dropping the oldest versions", () => {
    const existing = Array.from({ length: MAX_VERSIONS }, (_, index) => version(`v${index}`, index));
    const plan = planVersion(existing, version("next", 100));
    expect(plan?.keep).toHaveLength(MAX_VERSIONS);
    expect(plan?.keep[0]?.id).toBe("next");
    expect(plan?.drop).toEqual(["v0"]);
  });

  test("a smaller cap drops everything past it", () => {
    const existing = [version("a", 1), version("b", 2), version("c", 3)];
    const plan = planVersion(existing, version("d", 4), 2);
    expect(plan?.keep.map((item) => item.id)).toEqual(["d", "c"]);
    expect(plan?.drop.sort()).toEqual(["a", "b"]);
  });

  test("other projects' versions are ignored", () => {
    const other: ProjectVersion = { ...version("x", 5, defaultSnapshot("Same")), projectId: "p2" };
    const plan = planVersion([other], version("y", 6, defaultSnapshot("Same")));
    expect(plan?.keep.map((item) => item.id)).toEqual(["y"]);
  });

  test("timed versions wait for the interval", () => {
    expect(autoVersionDue(undefined, 10)).toBe(true);
    expect(autoVersionDue(0, 1000, 5000)).toBe(false);
    expect(autoVersionDue(0, 5000, 5000)).toBe(true);
  });
});
