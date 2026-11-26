#!/usr/bin/env node
/**
 * Hashes the inline scripts of every prerendered page and adds them to the page as a Content-Security-Policy
 * <meta>, after the build (the `postbuild` script):
 *
 *   node scripts/csp-hashes.mjs [directory]     default: .next/server
 *
 * Next.js writes inline scripts into static pages (the flight data, the theme script) and a static page cannot carry a
 * per-request nonce, so the policy of the header (lib/csp.ts) has to allow inline scripts. A page also carries a policy of
 * its own that allows its own scripts (`'self'`) and exactly the inline ones it was built with, by hash. A script has
 * to pass every policy, so a script put into the page afterwards (injected markup) is blocked. See SECURITY.md.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** The text of each inline script of a page: `<script>` with no `src`, exactly as written. */
export function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((match) => !/type="(application\/json|application\/ld\+json)"/.test(match[1]))
    .map((match) => match[2])
    .filter((text) => text !== "");
}

/** The `'sha256-...'` source of a script's text. */
export const scriptHash = (text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

/** The policy of a page: its own scripts and the inline ones it has, by hash. */
export function pagePolicy(scripts) {
  const hashes = [...new Set(scripts.map(scriptHash))];
  return ["script-src 'self'", ...hashes].join(" ");
}

const META = /<meta http-equiv="Content-Security-Policy" content="[^"]*"\/>/;

/** The page with its policy in the head (replacing an earlier one). A page with no head is returned as it is. */
export function withPolicy(html) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${pagePolicy(inlineScripts(html.replace(META, "")))}"/>`;
  const plain = html.replace(META, "");
  if (!plain.includes("<head>")) return html;
  return plain.replace("<head>", `<head>${meta}`);
}

async function* pages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(file);
    else if (entry.name.endsWith(".html")) yield file;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] ?? ".next/server";
  let count = 0;
  for await (const file of pages(root)) {
    const html = await readFile(file, "utf8");
    const next = withPolicy(html);
    if (next !== html) {
      await writeFile(file, next);
      count += 1;
    }
  }
  console.log(`Added a script policy with hashes to ${count} prerendered page(s).`);
}
