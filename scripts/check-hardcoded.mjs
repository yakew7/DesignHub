#!/usr/bin/env node
/**
 * Lists the English written in components instead of messages (docs/translating.md): the literal text of JSX
 * children, and the literal value of `aria-label`, `title`, `placeholder` and `alt`. A `t(...)` call or a variable is
 * not literal text, so it is not listed.
 *
 *   node scripts/check-hardcoded.mjs            lists them per studio (exit 0)
 *   node scripts/check-hardcoded.mjs --strict   exits 1 when there are any
 *   node scripts/check-hardcoded.mjs components/colors     only that folder
 *
 * Numbers, symbols, single letters, names that are the same in every language (formats, brands) and text with no
 * word of three letters are skipped. Add to `NAMES` a name that should be skipped, with the reason.
 */
import { readdir, readFile } from "node:fs/promises";
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
  for (const [studio, list] of [...byStudio].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n## ${studio} (${list.length})`);
    for (const item of list) console.log(`${item.file}:${item.line}  [${item.kind}] ${item.text}`);
  }
  console.error(
    `\n${total} literal English text(s) in ${byStudio.size} folder(s): ${[...byStudio].map(([s, l]) => `${s} ${l.length}`).join(", ")}`,
  );
  if (total > 0 && args.includes("--strict")) process.exit(1);
}
