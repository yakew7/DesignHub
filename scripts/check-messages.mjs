#!/usr/bin/env node
/**
 * Lists the English messages that no source file refers to. The English catalog is loaded by every route as the
 * fallback, so an unused message costs bytes everywhere.
 *
 *   node scripts/check-messages.mjs            lists them (exit 0)
 *   node scripts/check-messages.mjs --strict   exits 1 when there are any
 *
 * A key counts as used when its text (or, for a plural, its base without .one/.other) appears in a source file, or
 * when a template or a prefix there is a shape a key is built from: `studio.${id}.title`, "mockups.template." + id.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "hooks", "lib", "store", "types", "scripts"];
const skip = (file) =>
  /(^|\/)(node_modules|messages)\/|(^|\/)test-setup\.ts$|\.test\.tsx?$|check-messages\.mjs$/.test(file);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else if (/\.(tsx?|mjs)$/.test(entry.name) && !skip(file)) yield file;
  }
}

/** Every message key in the English catalog, read from its text. */
export function catalogKeys(source) {
  return [...source.matchAll(/^\s*"([a-z0-9][^"]*)":/gim)].map((match) => match[1]);
}

/**
 * What keys are built from in a source file, as regular expressions: a template such as `studio.${id}.title`
 * becomes /^studio\.[^.]+\.title$/ (each hole is one or more segments' worth of characters), and a string ending in
 * "." or "-" that is not a whole key on its own, used with + or inside a template, is a prefix.
 */
export function builtPatterns(source) {
  const found = new Map();
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  for (const match of source.matchAll(/`([a-z0-9][^`]*\$\{[^`]*)`/gi)) {
    const parts = match[1].split(/\$\{[^}]*\}/);
    if (!parts[0].includes(".") && !parts.join("").includes(".")) continue;
    const pattern = parts.map(escape).join("[a-z0-9.\\-]+");
    found.set(pattern, new RegExp(`^${pattern}$`, "i"));
  }
  for (const match of source.matchAll(/["']([a-z0-9][a-z0-9.\-]*[.\-])["']/gi)) {
    const prefix = match[1];
    if (prefix.length >= 4 && prefix.includes(".")) found.set(`^${prefix}`, new RegExp(`^${escape(prefix)}`, "i"));
  }
  return [...found.values()];
}

export function unusedKeys(keys, source, patterns) {
  return keys.filter((key) => {
    const base = key.replace(/\.(one|other)$/, "");
    if (source.includes(`"${key}"`) || source.includes(`'${key}'`) || source.includes(`\`${key}\``)) return false;
    if (
      base !== key &&
      (source.includes(`"${base}"`) || source.includes(`'${base}'`) || source.includes(`\`${base}\``))
    )
      return false;
    for (const pattern of patterns) if (pattern.test(key) || pattern.test(base)) return false;
    return true;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // The English catalog is split into a core file and one file per studio area (en-*.ts).
  const parts = (await readdir("lib/i18n/messages")).filter((name) => /^en-.+\.ts$/.test(name));
  const keys = [];
  for (const part of parts) keys.push(...catalogKeys(await readFile(path.join("lib/i18n/messages", part), "utf8")));
  let source = "";
  for (const root of roots) for await (const file of walk(root)) source += (await readFile(file, "utf8")) + "\n";
  const unused = unusedKeys(keys, source, builtPatterns(source));
  for (const key of unused) console.log(key);
  console.error(`${unused.length} of ${keys.length} English messages have no reference.`);
  if (unused.length > 0 && process.argv.includes("--strict")) process.exit(1);
}
