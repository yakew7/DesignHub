import { describe, expect, test } from "vitest";

import { sharedChunks, table } from "../../scripts/shared-chunks.mjs";

const files: Record<string, string> = {
  "a.js": Array.from({ length: 800 }, (_, i) => i * 7).join(",") + "react-dom hydrateRoot",
  "b.js": "app code only",
  "c.js": Array.from({ length: 200 }, (_, i) => i * 3).join(",") + "radix zustand",
  "d.js": "only the home page",
};
const stats = [
  { route: "/", firstLoadChunkPaths: ["a.js", "b.js", "c.js", "d.js"] },
  { route: "/colors", firstLoadChunkPaths: ["a.js", "b.js", "c.js"] },
  { route: "/svg", firstLoadChunkPaths: ["c.js", "b.js", "a.js"] },
];

describe("sharedChunks", () => {
  test("keeps the chunks every route loads, the biggest first, and names what the text shows", () => {
    const chunks = sharedChunks(stats, (path) => files[path] ?? "");
    expect(chunks.map((chunk) => chunk.path)).toEqual(["a.js", "c.js", "b.js"]);
    expect(chunks[0]?.marks).toEqual(["React DOM"]);
    expect(chunks[1]?.marks).toEqual(["Radix UI", "zustand"]);
    expect(chunks[2]?.marks).toEqual([]);
  });

  test("no routes, no chunks", () => {
    expect(sharedChunks([], () => "")).toEqual([]);
  });

  test("the table has a row per chunk and a total", () => {
    const text = table(sharedChunks(stats, (path) => files[path] ?? ""));
    expect(text).toContain("| `a.js` |");
    expect(text).toContain("app code");
    expect(text).toContain("**3 chunks**");
  });
});
