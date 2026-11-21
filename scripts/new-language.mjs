#!/usr/bin/env node
/**
 * Starts a new language (docs/translating.md, "Add a new language"):
 *
 *   pnpm new:language <code> [name]       for example: pnpm new:language de
 *
 * It creates the language's core (`lib/i18n/messages/<code>.ts`) and one part per area (`<code>-brand.ts`, ...), all
 * empty, so every message shows in English until it is translated. It registers the language in
 * `lib/i18n/locales.ts` (`locales`, `localeNames`, the loaders), `lib/i18n/all-catalogs.ts`, every
 * `lib/i18n/areas/<area>.ts` and `languagesInProgress` in `lib/i18n/complete-areas.ts`, and refuses a code that exists.
 * `name` is the language in its own name; it defaults to what the runtime knows (`de` is Deutsch).
 */
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const cap = (name) => name.charAt(0).toUpperCase() + name.slice(1);

/** Two-letter codes that cannot be the name of a `const`. */
const RESERVED = ["do", "if", "in"];

/** A two-letter lowercase language code that can be a TypeScript identifier. */
export const validCode = (code) => /^[a-z]{2}$/.test(code) && !RESERVED.includes(code);

/** The language in its own name, with a capital letter, or the code when the runtime does not know it. */
export function defaultName(code) {
  let name;
  try {
    name = new Intl.DisplayNames([code], { type: "language" }).of(code);
  } catch {
    name = undefined;
  }
  return name && name !== code ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code;
}

/** The language in English, for the comments in the files. */
function englishName(code) {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The new files, by path: the core and one part for each area. */
export function newFiles(code, areas) {
  const language = englishName(code);
  const files = {
    [`lib/i18n/messages/${code}.ts`]: `import type { Catalog } from "@/lib/i18n/translate";

/** ${language}. Keys left out here show in English. */
export const ${code} = {} satisfies Catalog;
`,
  };
  for (const area of areas) {
    files[`lib/i18n/messages/${code}-${area}.ts`] = `import type { Catalog } from "@/lib/i18n/translate";

/** ${language} messages of the ${area} area, loaded with the code that uses them. Keys left out show in English. */
export const ${code}${cap(area)} = {} satisfies Catalog;
`;
  }
  return files;
}

/** Inserts `text` after the end of the last match of `pattern`. */
function insertAfterLast(source, pattern, text, what) {
  const last = [...source.matchAll(pattern)].at(-1);
  if (!last) throw new Error(`could not find ${what}`);
  const end = last.index + last[0].length;
  return source.slice(0, end) + text + source.slice(end);
}

/** Registers the language in `locales.ts`: `locales`, the loaders and `localeNames`. */
export function patchLocales(source, code, name) {
  let next = source.replace(/(export const locales = \[[^\]]*?)(\] as const;)/, (_, body, end) => {
    return `${body}, "${code}"${end}`;
  });
  if (next === source) throw new Error("could not find `locales`");
  next = insertAfterLast(
    next,
    /^ {2}\w\w: \(\) => import\("@\/lib\/i18n\/messages\/\w\w"\)\.then\(\(module\) => module\.\w\w\),$/gm,
    `\n  ${code}: () => import("@/lib/i18n/messages/${code}").then((module) => module.${code}),`,
    "the loaders",
  );
  return insertAfterLast(
    next,
    /^ {2}\w\w: "[^"\n]*",$(?=\n\};\n\n\/\*\* Per-viewer)/gm,
    `\n  ${code}: ${JSON.stringify(name)},`,
    "`localeNames`",
  );
}

/** Adds the language's parts to `all-catalogs.ts`: the imports and the joined catalog. */
export function patchCatalogs(source, code, areas) {
  const names = [code, ...areas.map((area) => `${code}${cap(area)}`)];
  const lines = names.map((id, index) => {
    const file = index === 0 ? code : `${code}-${areas[index - 1]}`;
    return `import { ${id} } from "@/lib/i18n/messages/${file}";`;
  });
  const marker = 'import type { Locale } from "@/lib/i18n/locales";';
  if (!source.includes(marker)) throw new Error("could not find the end of the imports");
  let next = source.replace(marker, `${lines.join("\n")}\n${marker}`);
  const end = next.lastIndexOf("\n};");
  if (end < 0) throw new Error("could not find the end of `catalogs`");
  return `${next.slice(0, end)}\n  ${code}: { ${names.map((id) => `...${id}`).join(", ")} },${next.slice(end)}`;
}

/** Adds the language to an area's `registerAreaLoaders` call. */
export function patchArea(source, code, area) {
  return insertAfterLast(
    source,
    /^ {2}\w\w: \(\) => import\("@\/lib\/i18n\/messages\/\w\w-[\w-]+"\)\.then\(\(module\) => module\.\w+\),$/gm,
    `\n  ${code}: () => import("@/lib/i18n/messages/${code}-${area}").then((module) => module.${code}${cap(area)}),`,
    `the loaders of the ${area} area`,
  );
}

/** Adds the language to `languagesInProgress`: it is empty, so the completeness tests skip it. */
export function patchInProgress(source, code) {
  const next = source.replace(/(export const languagesInProgress[^=]*= \[)([^\]]*?)(\])/, (_, open, body, close) => {
    const entries = body.trim() ? `${body.trim().replace(/,$/, "")}, ` : "";
    return `${open}${entries}"${code}"${close}`;
  });
  if (next === source) throw new Error("could not find `languagesInProgress`");
  return next;
}

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

if (import.meta.url === `file://${process.argv[1]}`) {
  const code = process.argv[2];
  if (!code || !validCode(code)) {
    console.error("Usage: pnpm new:language <code> [name]   (two lowercase letters, such as de)");
    process.exit(2);
  }
  const areas = (await readdir("lib/i18n/areas"))
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => file.slice(0, -3))
    .sort();
  const name = process.argv[3] ?? defaultName(code);
  const locales = await readFile("lib/i18n/locales.ts", "utf8");
  const known = /export const locales = \[([^\]]*)\]/.exec(locales)?.[1] ?? "";
  const files = newFiles(code, areas);
  const taken = [];
  if (new RegExp(`"${code}"`).test(known)) taken.push("lib/i18n/locales.ts");
  for (const path of Object.keys(files)) if (await exists(path)) taken.push(path);
  if (taken.length > 0) {
    console.error(`The language ${code} exists already (${taken.join(", ")}).`);
    process.exit(1);
  }
  for (const [path, text] of Object.entries(files)) await writeFile(path, text);
  const edits = [
    ["lib/i18n/locales.ts", (source) => patchLocales(source, code, name)],
    ["lib/i18n/all-catalogs.ts", (source) => patchCatalogs(source, code, areas)],
    ["lib/i18n/complete-areas.ts", (source) => patchInProgress(source, code)],
    ...areas.map((area) => [`lib/i18n/areas/${area}.ts`, (source) => patchArea(source, code, area)]),
  ];
  for (const [path, patch] of edits) await writeFile(path, patch(await readFile(path, "utf8")));
  execFileSync("pnpm", ["exec", "prettier", "--write", ...Object.keys(files), ...edits.map(([path]) => path)], {
    stdio: "ignore",
  });
  console.log(
    `Created the ${name} language (${Object.keys(files).length} files, empty) and registered it in locales.ts, all-catalogs.ts, complete-areas.ts and ${areas.length} areas.`,
  );
  console.log(
    `Next: translate the messages in lib/i18n/messages/${code}.ts and ${code}-<area>.ts (keys you leave out show`,
  );
  console.log(
    `in English), and remove "${code}" from languagesInProgress in lib/i18n/complete-areas.ts once every complete`,
  );
  console.log("area has all its keys. See docs/translating.md.");
}
