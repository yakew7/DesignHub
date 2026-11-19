#!/usr/bin/env node
/**
 * Checks that every source file that uses a message of a studio area imports the area (see
 * docs/i18n-architecture.md). A file that uses a `colors.` key without `import "@/lib/i18n/areas/colors"`, directly or
 * through a file of its own folder that it imports, would show the key itself instead of its text.
 *
 *   node scripts/check-areas.mjs        lists the files that miss an import (exit 1 when there are any)
 *
 * A key is a string that is a key of the area, or a template or a prefix that some key of the area starts with
 * (`colors.tab.${id}`). Comments are not read. A file can opt out with `// check-areas: ignore <reason>`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "hooks", "lib", "store"];
const skip = (file) =>
  /(^|\/)(node_modules|messages|areas)\/|\.test\.tsx?$|(^|\/)test-setup\.ts$|(^|\/)complete-areas\.ts$|(^|\/)lib\/test\//.test(
    file,
  );

/** The text of a source file without its comments. */
export function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

/** The areas a source file needs: those with a key, a template or a prefix of a key among its strings. */
export function neededAreas(source, keysByArea) {
  const text = withoutComments(source);
  const found = new Set();
  for (const match of text.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    let literal = match[2];
    const hole = literal.indexOf("${");
    if (hole >= 0) literal = literal.slice(0, hole);
    if (!literal) continue;
    for (const [area, keys] of Object.entries(keysByArea)) {
      if (!literal.startsWith(`${area}.`)) continue;
      const exact = hole < 0 && keys.has(literal);
      const prefix = (hole >= 0 || literal.endsWith(".")) && [...keys].some((key) => key.startsWith(literal));
      if (exact || prefix) found.add(area);
    }
  }
  return found;
}

/** The areas a source file imports directly. */
export function importedAreas(source) {
  return new Set([...source.matchAll(/import\s+["']@\/lib\/i18n\/areas\/([a-z0-9-]+)["']/g)].map((match) => match[1]));
}

/** The local files a source file imports (an `@/` or a relative path), as paths without an extension. */
export function localImports(file, source) {
  const found = [];
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    const target = match[1];
    if (target.startsWith("@/")) found.push(target.slice(2));
    else if (target.startsWith(".")) found.push(path.posix.join(path.posix.dirname(file), target));
  }
  return found;
}

/**
 * The files that use an area and do not import it. `files` maps a path to its source. An import counts when it is in
 * the file or in a file of the same folder that it imports, followed through further files of that folder.
 */
export function findMissingImports(files, keysByArea) {
  const byBase = new Map();
  for (const file of files.keys()) byBase.set(file.replace(/\.(tsx?|mjs)$/, ""), file);
  const resolve = (base) => byBase.get(base) ?? byBase.get(`${base}/index`);
  const covered = (file, area, seen = new Set()) => {
    if (seen.has(file)) return false;
    seen.add(file);
    const source = files.get(file) ?? "";
    if (importedAreas(source).has(area)) return true;
    return localImports(file, source).some((target) => {
      const next = resolve(target);
      return next !== undefined && path.posix.dirname(next) === path.posix.dirname(file) && covered(next, area, seen);
    });
  };
  const missing = [];
  for (const [file, source] of files) {
    if (/\/\/ check-areas: ignore/.test(source)) continue;
    for (const area of neededAreas(source, keysByArea)) {
      if (!covered(file, area)) missing.push({ file, area });
    }
  }
  return missing;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else if (/\.(tsx?|mjs)$/.test(entry.name) && !skip(file)) yield file;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const areas = (await readdir("lib/i18n/areas")).map((name) => name.replace(/\.ts$/, ""));
  const keysByArea = {};
  for (const area of areas) {
    const text = await readFile(`lib/i18n/messages/en-${area}.ts`, "utf8");
    keysByArea[area] = new Set([...text.matchAll(/^\s*"([a-z0-9][^"]*)":/gim)].map((match) => match[1]));
  }
  const files = new Map();
  for (const root of roots) for await (const file of walk(root)) files.set(file, await readFile(file, "utf8"));
  const missing = findMissingImports(files, keysByArea);
  for (const { file, area } of missing)
    console.log(`${file}: uses ${area}. keys, add import "@/lib/i18n/areas/${area}";`);
  console.error(`${missing.length} file(s) use an area's messages without importing the area.`);
  if (missing.length > 0) process.exit(1);
}
