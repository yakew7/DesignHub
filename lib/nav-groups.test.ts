import { describe, expect, test } from "vitest";

import { cleanFolded, groupOfPath, isGroupOpen, toggleFolded } from "@/lib/nav-groups";
import { studioOfPath, studios } from "@/lib/navigation";

describe("studioOfPath", () => {
  test("finds the studio of a route and its sub-paths, and none for the home page", () => {
    for (const studio of studios) {
      expect(studioOfPath(studio.href)?.id, studio.id).toBe(studio.id);
      expect(studioOfPath(`${studio.href}/subpage`)?.id, studio.id).toBe(studio.id);
    }
    expect(studioOfPath("/")).toBeNull();
    expect(studioOfPath("/nowhere")).toBeNull();
  });
});

describe("sidebar groups", () => {
  test("finds the group of a route, and none for the home page", () => {
    for (const studio of studios) expect(groupOfPath(studio.href), studio.id).toBe(studio.group);
    expect(groupOfPath("/")).toBeNull();
    expect(groupOfPath("/nowhere")).toBeNull();
  });

  test("every group is open on a first visit", () => {
    for (const group of ["Brand", "Design", "Tools"] as const) expect(isGroupOpen(group, [], "/")).toBe(true);
  });

  test("a folded group is closed, except the one that holds the current page", () => {
    const colors = studios.find((studio) => studio.id === "colors")!;
    expect(isGroupOpen("Brand", ["Brand", "Design"], "/")).toBe(false);
    expect(isGroupOpen("Design", ["Brand", "Design"], colors.href)).toBe(true);
    expect(isGroupOpen("Brand", ["Brand", "Design"], colors.href)).toBe(false);
  });

  test("toggling folds and unfolds, without repeats", () => {
    expect(toggleFolded([], "Tools")).toEqual(["Tools"]);
    expect(toggleFolded(["Tools"], "Tools")).toEqual([]);
    expect(toggleFolded(["Brand"], "Tools")).toEqual(["Brand", "Tools"]);
  });

  test("saved state keeps only real groups, once each, in order", () => {
    expect(cleanFolded(["Tools", "Gone", "Brand", "Tools", 4])).toEqual(["Brand", "Tools"]);
    expect(cleanFolded("Brand")).toEqual([]);
    expect(cleanFolded(undefined)).toEqual([]);
  });
});
