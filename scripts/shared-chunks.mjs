#!/usr/bin/env node
/**
 * Lists the script chunks every route loads (the shared part of each first load), biggest first, with what each is
 * made of as far as its text shows (a library's name survives minifying in strings and property names):
 *
 *   pnpm build && pnpm bundle:shared
 *
 * It reads `.next/diagnostics/route-bundle-stats.json`, which `next build` writes. docs/performance.md uses it.
 */
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

/** Names that identify a library or a layer in minified code. */
const MARKS = [
  ["react-dom", "React DOM"],
  ["hydrateRoot", "React DOM"],
  ["AppRouter", "Next.js app router"],
  ["__next_f", "Next.js flight data"],
  ["data-radix", "Radix UI"],
  ["radix", "Radix UI"],
  ["lucide", "lucide icons"],
  ["zustand", "zustand"],
  ["next-themes", "next-themes"],
  ["Intl.PluralRules", "the app's translator"],
];

/** The chunks all routes share, with sizes and marks. `read(path)` returns a chunk's text. */
export function sharedChunks(stats, read) {
  const sets = stats.map((route) => new Set(route.firstLoadChunkPaths));
  const shared = sets.length ? [...sets[0]].filter((path) => sets.every((set) => set.has(path))) : [];
  return shared
    .map((path) => {
      const text = read(path);
      const marks = [...new Set(MARKS.filter(([needle]) => text.includes(needle)).map(([, name]) => name))];
      return { path, raw: Buffer.byteLength(text), gzip: gzipSync(text).length, marks };
    })
    .sort((a, b) => b.gzip - a.gzip);
}

export function table(chunks) {
  const kb = (bytes) => (bytes / 1024).toFixed(1);
  const rows = chunks.map(
    (chunk) =>
      `| \`${chunk.path.split("/").pop()}\` | ${kb(chunk.gzip)} | ${kb(chunk.raw)} | ${chunk.marks.join(", ") || "app code"} |`,
  );
  const total = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0);
  return [
    "| Chunk | gzip kB | raw kB | Contains |",
    "| --- | ---: | ---: | --- |",
    ...rows,
    `| **${chunks.length} chunks** | **${kb(total)}** | | |`,
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const stats = JSON.parse(
    await readFile(".next/diagnostics/route-bundle-stats.json", "utf8").catch(() => {
      console.error("Run `pnpm build` first: .next/diagnostics/route-bundle-stats.json is written by the build.");
      process.exit(1);
    }),
  );
  const { readFileSync } = await import("node:fs");
  console.log(table(sharedChunks(stats, (path) => readFileSync(path, "utf8"))));
}
