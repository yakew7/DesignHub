#!/usr/bin/env node
/**
 * Fails when any tracked file contains an em dash. The project style is normal hyphens
 * and proper punctuation, so this runs in CI (.github/workflows/em-dash.yml).
 *
 *   pnpm check:dashes
 *
 * Catches the character itself plus the HTML entity and JavaScript/JSON escapes that
 * would render as one. The patterns are assembled from code points so this file never
 * matches itself.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EM_DASH = String.fromCharCode(0x2014);
const patterns = [EM_DASH, "&" + "mdash;", "&#" + "8212;", "&#x" + "2014;", "\\" + "u2014", "\\" + "u{2014}"];

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip|gz)$/i;

const files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .split("\0")
  .filter((file) => file && !BINARY.test(file));

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // Deleted but still staged, or unreadable.
  }
  if (text.includes("\0")) continue;
  text.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of patterns) {
      const column = line.indexOf(pattern);
      if (column !== -1) hits.push({ file, line: index + 1, column: column + 1, text: line.trim() });
    }
  });
}

if (hits.length === 0) {
  console.log(`No em dashes in ${files.length} files.`);
  process.exit(0);
}

for (const hit of hits) {
  // GitHub Actions turns this into an inline annotation on the pull request.
  if (process.env.GITHUB_ACTIONS) {
    console.log(
      `::error file=${hit.file},line=${hit.line},col=${hit.column}::Em dash found. Use a comma, colon, period, parentheses or a spaced hyphen instead.`,
    );
  }
  console.log(`${hit.file}:${hit.line}:${hit.column}  ${hit.text.slice(0, 140)}`);
}
console.log(
  `\n${hits.length} em dash${hits.length === 1 ? "" : "es"} found. Rewrite each one with normal punctuation:` +
    "\n  a pause or aside  -> comma or parentheses" +
    "\n  an explanation    -> colon" +
    "\n  two sentences     -> period" +
    '\n  a range or label  -> hyphen ("150-200ms", "Acme - brand guidelines")',
);
process.exit(1);
