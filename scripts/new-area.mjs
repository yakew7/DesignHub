#!/usr/bin/env node
/**
 * Starts a new message area (docs/i18n-architecture.md, "Adding an area"):
 *
 *   pnpm new:area <name>        for example: pnpm new:area reports
 *
 * It creates the English, Spanish, French and Hindi parts (`en-<name>.ts`, `es-<name>.ts`, ...) and
 * `lib/i18n/areas/<name>.ts`, and joins the new parts in `lib/i18n/messages/en.ts`, `lib/i18n/all-catalogs.ts` and
 * `lib/i18n/areas.test.ts`. What is left to do by hand is printed: add the keys, import the area from the files that use
 * them, and add the prefix to `completeAreas` once every language has all its keys.
 */
import { access, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const LANGUAGES = [
  ["es", "Spanish"],
  ["fr", "French"],
  ["hi", "Hindi"],
];

const cap = (name) => name.charAt(0).toUpperCase() + name.slice(1);

/** A name that is a key prefix: lowercase letters and digits, starting with a letter. */
export const validName = (name) => /^[a-z][a-z0-9]*$/.test(name);

/** The new files, by path. */
export function newFiles(name) {
  const Name = cap(name);
  const files = {
    [`lib/i18n/messages/en-${name}.ts`]: `/** English messages of the ${name} area, registered by the code that uses them. */\nexport const en${Name} = {} as const;\n`,
    [`lib/i18n/areas/${name}.ts`]: `import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { en${Name} } from "@/lib/i18n/messages/en-${name}";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the ${name} English messages available, and asks for the area's other languages. Every file
// that uses a \`${name}.\` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(en${Name});
registerAreaLoaders("${name}", {
  es: () => import("@/lib/i18n/messages/es-${name}").then((module) => module.es${Name}),
  fr: () => import("@/lib/i18n/messages/fr-${name}").then((module) => module.fr${Name}),
  hi: () => import("@/lib/i18n/messages/hi-${name}").then((module) => module.hi${Name}),
});
`,
  };
  for (const [code, language] of LANGUAGES) {
    files[`lib/i18n/messages/${code}-${name}.ts`] = `import type { Catalog } from "@/lib/i18n/translate";

/** ${language} messages of the ${name} area, loaded with the code that uses them. Keys left out show in English. */
export const ${code}${Name} = {} satisfies Catalog;
`;
  }
  return files;
}

/** Adds the English part to `en.ts`: its import and its place in the joined catalog. */
export function patchEn(source, name) {
  const Name = cap(name);
  const imports = [...source.matchAll(/^import \{ en\w+ \} from "@\/lib\/i18n\/messages\/en-[\w-]+";$/gm)];
  const last = imports.at(-1);
  if (!last) throw new Error("lib/i18n/messages/en.ts has no part imports");
  let next =
    source.slice(0, last.index + last[0].length) +
    `\nimport { en${Name} } from "@/lib/i18n/messages/en-${name}";` +
    source.slice(last.index + last[0].length);
  next = next.replace(
    /(export const en = \{[\s\S]*?)(\s*\} as const;)/,
    (_, body, end) => `${body.replace(/,\s*$/, "")}, ...en${Name},${end}`,
  );
  return next;
}

/** Adds each language's part to `all-catalogs.ts`: the imports and the joined catalogs. */
export function patchCatalogs(source, name) {
  const Name = cap(name);
  let next = source;
  for (const [code] of LANGUAGES) {
    const line = `import { ${code}${Name} } from "@/lib/i18n/messages/${code}-${name}";`;
    const imports = [
      ...next.matchAll(
        new RegExp(`^import \\{ ${code}\\w* \\} from "@/lib/i18n/messages/${code}(?:-[\\w-]+)?";$`, "gm"),
      ),
    ];
    const last = imports.at(-1);
    if (!last) throw new Error(`all-catalogs.ts has no ${code} imports`);
    next = next.slice(0, last.index + last[0].length) + `\n${line}` + next.slice(last.index + last[0].length);
    next = next.replace(
      new RegExp(`(\\b${code}: \\{[^}]*?)(\\s*\\},)`),
      (_, body, end) => `${body.replace(/,\\s*$/, "")}, ...${code}${Name},${end}`,
    );
  }
  return next;
}

/** Adds the part to the test of the parts: its import, `parts` and the owner of its prefix. */
export function patchTest(source, name) {
  const Name = cap(name);
  const imports = [...source.matchAll(/^import \{ en\w+ \} from "@\/lib\/i18n\/messages\/en-[\w-]+";$/gm)];
  const last = imports.at(-1);
  if (!last) throw new Error("areas.test.ts has no part imports");
  let next =
    source.slice(0, last.index + last[0].length) +
    `\nimport { en${Name} } from "@/lib/i18n/messages/en-${name}";` +
    source.slice(last.index + last[0].length);
  next = next.replace(
    /(const parts = \{)([^}]*?)(\s*\};)/,
    (_, open, body, end) => `${open}${body.replace(/,\s*$/, "")}, en${Name},${end}`,
  );
  next = next.replace(
    /(const owners: \[string, Record<string, string>\]\[\] = \[)([\s\S]*?)(\n?\s*\];)/,
    (_, open, body, end) => `${open}${body.replace(/,?\s*$/, ",")}\n      ["${name}.", en${Name}],${end}`,
  );
  return next;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2];
  if (!name || !validName(name)) {
    console.error("Usage: pnpm new:area <name>   (lowercase letters and digits, starting with a letter)");
    process.exit(2);
  }
  const files = newFiles(name);
  for (const path of Object.keys(files)) {
    const exists = await access(path).then(
      () => true,
      () => false,
    );
    if (exists) {
      console.error(`${path} already exists: the ${name} area is there already.`);
      process.exit(1);
    }
  }
  for (const [path, text] of Object.entries(files)) await writeFile(path, text);
  const edits = [
    ["lib/i18n/messages/en.ts", patchEn],
    ["lib/i18n/all-catalogs.ts", patchCatalogs],
    ["lib/i18n/areas.test.ts", patchTest],
  ];
  for (const [path, patch] of edits) await writeFile(path, patch(await readFile(path, "utf8"), name));
  execFileSync("pnpm", ["exec", "prettier", "--write", ...Object.keys(files), ...edits.map(([path]) => path)], {
    stdio: "ignore",
  });
  console.log(
    `Created the ${name} area (${Object.keys(files).length} files) and joined it in en.ts, all-catalogs.ts and areas.test.ts.`,
  );
  console.log(
    `Next: add the keys to en-${name}.ts (and es, fr, hi), add import "@/lib/i18n/areas/${name}"; to the files that use them,`,
  );
  console.log(
    `and add "${name}." to completeAreas in lib/i18n/complete-areas.ts once every language has all its keys.`,
  );
}
