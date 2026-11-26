#!/usr/bin/env node
/**
 * Lists the English written in components instead of messages (docs/translating.md): the literal text of JSX
 * children, and the literal value of `aria-label`, `title`, `placeholder` and `alt`. A `t(...)` call or a variable is
 * not literal text, so it is not listed.
 *
 *   node scripts/check-hardcoded.mjs            lists them per studio (exit 0)
 *   node scripts/check-hardcoded.mjs --strict   exits 1 when there are any
 *   node scripts/check-hardcoded.mjs components/colors     only that folder
 *   node scripts/check-hardcoded.mjs --ratchet             compares the count of each folder with hardcoded-baseline.json
 *   node scripts/check-hardcoded.mjs --write-baseline      writes the current counts to hardcoded-baseline.json
 *
 * The ratchet fails when a folder has more literal English than the baseline (a new hard-coded label), and when it has
 * less (the number must be lowered, so the progress stays), and says which file and line to look at.
 *
 * Numbers, symbols, single letters, names that are the same in every language (formats, brands) and text with no
 * word of three letters are skipped. Add to `NAMES` a name that should be skipped, with the reason.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

/** Names that are not translated: formats, brands, technical terms. */
const NAMES = new Set([
  "SVG",
  "PNG",
  "JPG",
  "JPEG",
  "WebP",
  "PDF",
  "ZIP",
  "CSS",
  "SCSS",
  "HTML",
  "JSON",
  "JSX",
  "TSX",
  "XML",
  "URL",
  "Tailwind",
  "React",
  "Vue",
  "Svelte",
  "Angular",
  "Solid",
  "Qwik",
  "Lit",
  "Astro",
  "Preact",
  "Figma",
  "Xcode",
  "Android",
  "Flutter",
  "Material",
  "GitHub",
  "Google",
  // The product name of the font service the Typography Studio browses, spelled the same in every language.
  "Google Fonts",
  "Iconify",
  "OpenAI",
  "Anthropic",
  "DesignHub",
  "OKLCH",
  "HSL",
  "RGB",
  "HEX",
  "WCAG",
  "AAA",
  "AA",
  "Markdown",
  "LinkedIn",
  "Instagram",
  "YouTube",
  "Pinterest",
  "Twitch",
  "Facebook",
  "Medium",
  "Reddit",
  "Discord",
  "Slack",
  "Notion",
  "Dribbble",
  "Behance",
  "Spotify",
  "TikTok",
  "Snapchat",
]);

const ATTRIBUTES = new Set(["aria-label", "title", "placeholder", "alt"]);

/** True for text a person reads and a translator would translate. */
export function isEnglishText(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]{3,}/.test(clean)) return false;
  if (NAMES.has(clean)) return false;
  // Only names and symbols: every word is a known name, a number or punctuation.
  const words = clean.split(/[\s,/&+·|:()\-–]+/).filter(Boolean);
  if (words.every((word) => NAMES.has(word) || !/[A-Za-z]{3,}/.test(word))) return false;
  // A function call or a CSS value is code: oklch(0.5 0.1 20), var(--x).
  if (/\w\([^)]*\d|var\(/.test(clean)) return false;
  // A code-like token (an id, a path, a CSS value) has no space and a symbol or a digit in it.
  if (!clean.includes(" ") && /[^A-Za-z]/.test(clean)) return false;
  return true;
}

/** The literal English in a component's source: `{ line, text, kind }` for each. */
export function hardcodedIn(file, source) {
  const found = [];
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const add = (node, text, kind) => {
    if (isEnglishText(text)) {
      found.push({
        line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
        text: text.replace(/\s+/g, " ").trim(),
        kind,
      });
    }
  };
  const visit = (node) => {
    if (ts.isJsxText(node)) add(node, node.text, "text");
    if (ts.isJsxAttribute(node) && ATTRIBUTES.has(node.name.getText(tree))) {
      const init = node.initializer;
      if (init && ts.isStringLiteral(init)) add(init, init.text, node.name.getText(tree));
      else if (init && ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression)) {
        add(init, init.expression.text, node.name.getText(tree));
      }
    }
    // A string literal child: {"text"} or {`text`}.
    if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      if (node.expression && ts.isStringLiteralLike(node.expression)) add(node, node.expression.text, "text");
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return found;
}

/**
 * The ratchet: the folders whose count is not the baseline's. `counts` and `baseline` map a folder to its count; a
 * folder missing from the baseline counts as 0. An increase is a new hard-coded text, a decrease is progress that has
 * to be written down.
 */
export function ratchet(counts, baseline) {
  const errors = [];
  for (const folder of [...new Set([...Object.keys(counts), ...Object.keys(baseline)])].sort()) {
    const now = counts[folder] ?? 0;
    const was = baseline[folder] ?? 0;
    if (now > was) errors.push({ folder, now, was, kind: "up" });
    else if (now < was) errors.push({ folder, now, was, kind: "down" });
  }
  return errors;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) yield file;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const roots = args.filter((arg) => !arg.startsWith("--"));
  const byStudio = new Map();
  let total = 0;
  for (const root of roots.length ? roots : ["components"]) {
    for await (const file of walk(root)) {
      const found = hardcodedIn(file, await readFile(file, "utf8"));
      if (found.length === 0) continue;
      const studio = file.split("/")[1] ?? file;
      const list = byStudio.get(studio) ?? [];
      list.push(...found.map((item) => ({ file, ...item })));
      byStudio.set(studio, list);
      total += found.length;
    }
  }
  const counts = Object.fromEntries([...byStudio].map(([studio, list]) => [studio, list.length]));
  if (args.includes("--write-baseline")) {
    const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile("hardcoded-baseline.json", `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`Wrote hardcoded-baseline.json: ${total} literal English text(s) in ${byStudio.size} folder(s).`);
    process.exit(0);
  }
  if (args.includes("--ratchet")) {
    const baseline = JSON.parse(await readFile("hardcoded-baseline.json", "utf8"));
    const errors = ratchet(counts, baseline);
    for (const { folder, now, was, kind } of errors) {
      if (kind === "up") {
        console.error(
          `::error::components/${folder} has ${now} hard-coded English text(s), the baseline allows ${was}. Use a message (t(...)) for the new text; the list below shows where.`,
        );
        for (const item of byStudio.get(folder) ?? [])
          console.error(`  ${item.file}:${item.line}  [${item.kind}] ${item.text}`);
      } else {
        console.error(
          `::error::components/${folder} is down to ${now} hard-coded English text(s) from ${was}. Good: run "pnpm check:hardcoded --write-baseline" and commit hardcoded-baseline.json so it stays down.`,
        );
      }
    }
    console.log(
      errors.length
        ? `${errors.length} folder(s) differ from the baseline.`
        : `The baseline holds: ${total} literal English text(s) in ${byStudio.size} folder(s).`,
    );
    process.exit(errors.length ? 1 : 0);
  }
  for (const [studio, list] of [...byStudio].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n## ${studio} (${list.length})`);
    for (const item of list) console.log(`${item.file}:${item.line}  [${item.kind}] ${item.text}`);
  }
  console.error(
    `\n${total} literal English text(s) in ${byStudio.size} folder(s): ${[...byStudio].map(([s, l]) => `${s} ${l.length}`).join(", ")}`,
  );
  if (total > 0 && args.includes("--strict")) process.exit(1);
}
