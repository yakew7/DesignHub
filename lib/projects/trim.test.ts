import { describe, expect, test } from "vitest";

import type { ProjectVersion } from "@/lib/projects/history";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { sizesByProject, versionsToTrim } from "@/lib/projects/trim";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_000 * DAY;
const version = (id: string, projectId: string, daysAgo: number): ProjectVersion => ({
  id,
  projectId,
  createdAt: NOW - daysAgo * DAY,
  reason: "autosave",
  snapshot: defaultSnapshot(id),
});

describe("versionsToTrim", () => {
  test("removes versions older than the cut-off, per project, and always keeps the newest of each", () => {
    const versions = [
      version("a1", "a", 400),
      version("a2", "a", 100),
      version("a3", "a", 10),
      version("b1", "b", 500),
      version("b2", "b", 450),
    ];
    expect(
      versionsToTrim(versions, 90, NOW)
        .map((item) => item.id)
        .sort(),
    ).toEqual(["a1", "a2", "b1"]);
    // b2 is old too, but it is the newest of project b, so it stays.
    expect(
      versionsToTrim(versions, 365, NOW)
        .map((item) => item.id)
        .sort(),
    ).toEqual(["a1", "b1"]);
  });

  test("nothing is removed when everything is newer than the cut-off", () => {
    expect(versionsToTrim([version("a1", "a", 5), version("a2", "a", 1)], 30, NOW)).toEqual([]);
  });

  test("what is removed is always the oldest part of a project's history", () => {
    const versions = [version("a1", "a", 300), version("a2", "a", 200), version("a3", "a", 100), version("a4", "a", 1)];
    const removed = new Set(versionsToTrim(versions, 90, NOW).map((item) => item.id));
    const kept = versions.filter((item) => !removed.has(item.id));
    const oldestKept = Math.min(...kept.map((item) => item.createdAt));
    for (const item of versions) if (removed.has(item.id)) expect(item.createdAt).toBeLessThan(oldestKept);
  });
});

describe("sizesByProject", () => {
  test("lists the largest first, with the history counted apart", () => {
    const rows = sizesByProject(
      [
        { id: "a", name: "A", bytes: 100 },
        { id: "b", name: "B", bytes: 50 },
      ],
      [
        { projectId: "b", bytes: 400 },
        { projectId: "b", bytes: 100 },
        { projectId: "a", bytes: 10 },
      ],
    );
    expect(rows.map((row) => row.id)).toEqual(["b", "a"]);
    expect(rows[0]).toMatchObject({ project: 50, history: 500, versions: 2 });
  });
});
