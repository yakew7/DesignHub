import { describe, expect, test } from "vitest";

import { chosenImports, matchEntries } from "@/lib/projects/import-match";
import { snapshotKey } from "@/lib/projects/history";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import type { ProjectEntry } from "@/lib/projects/transfer";

const entry = (name: string, id?: string, accent = 0): ProjectEntry => {
  const snapshot = defaultSnapshot(name);
  snapshot.tokens.settings.radiusBase += accent;
  return { id, favorite: false, tags: [], snapshot, history: [] };
};

/** Stored projects: the key of each id's snapshot, read the way the app reads it. */
const store = (...projects: [string, ProjectEntry][]) => {
  const keys = new Map(projects.map(([id, item]) => [id, snapshotKey(item.snapshot)]));
  const reads: string[] = [];
  return {
    stored: projects.map(([id, item]) => ({ id, name: item.snapshot.brand.profile.name })),
    keyOf: async (id: string) => {
      reads.push(id);
      return keys.get(id);
    },
    reads,
  };
};

describe("matchEntries", () => {
  test("an entry whose id is stored is that project, even when it was edited since", async () => {
    const { stored, keyOf, reads } = store(["a", entry("Acme", undefined, 4)]);
    const matches = await matchEntries([entry("Acme", "a")], stored, keyOf);
    expect(matches).toEqual([{ id: "a", by: "id" }]);
    expect(reads).toEqual([]);
  });

  test("an entry with an unknown id and a new name is new", async () => {
    const { stored, keyOf } = store(["a", entry("Acme")]);
    expect(await matchEntries([entry("Other", "zzz")], stored, keyOf)).toEqual([null]);
  });

  test("an entry with no id is an identical copy only: same name and same snapshot", async () => {
    const { stored, keyOf, reads } = store(["a", entry("Acme")], ["b", entry("Beta")]);
    const matches = await matchEntries([entry("Acme"), entry("Acme", undefined, 2), entry("Gamma")], stored, keyOf);
    expect(matches).toEqual([{ id: "a", by: "copy" }, null, null]);
    // Only the projects that share a name are read.
    expect(new Set(reads)).toEqual(new Set(["a"]));
  });

  test("a stored project is matched by one entry at most", async () => {
    const { stored, keyOf } = store(["a", entry("Acme")]);
    const matches = await matchEntries([entry("Acme", "a"), entry("Acme", "a"), entry("Acme")], stored, keyOf);
    expect(matches).toEqual([{ id: "a", by: "id" }, null, null]);
  });
});

describe("chosenImports", () => {
  const entries = [entry("One"), entry("Two"), entry("Three")];
  const matches = [null, { id: "stored-two", by: "id" as const }, null];

  test("a new project follows its checkbox and a stored one is skipped unless replacing", () => {
    expect(chosenImports(entries, matches, new Set([0, 1, 2]), new Set())).toEqual([
      { entry: entries[0], replaceId: null },
      { entry: entries[2], replaceId: null },
    ]);
    expect(chosenImports(entries, matches, new Set(), new Set())).toEqual([]);
  });

  test("replacing names the stored project, in the order of the file", () => {
    expect(chosenImports(entries, matches, new Set([2]), new Set([1]))).toEqual([
      { entry: entries[1], replaceId: "stored-two" },
      { entry: entries[2], replaceId: null },
    ]);
  });
});
