#!/usr/bin/env node
/**
 * Reports the first-load client JS of every App Router page after `next build`, and
 * optionally compares it with a baseline (CI compares a pull request with `main`, see
 * .github/workflows/bundle-size.yml).
 *
 *   pnpm build && pnpm bundle:size                      # print the table
 *   pnpm bundle:size --json bundle-size.json            # also save the sizes
 *   pnpm bundle:size --base main.json                   # compare, exit 1 on >10% growth
 *   pnpm bundle:size --dir ../other-checkout            # measure another checkout's .next
 *
 * Next.js 16 no longer prints "First Load JS" in `next build`, so this reads the build
 * output instead. A page's first-load JS is the shared runtime (`rootMainFiles` in
 * .next/build-manifest.json) plus the entry chunks of the page and its layouts
 * (`entryJSFiles` in the page's client reference manifest). Those are the same `<script>`
 * tags the prerendered HTML loads, minus the `noModule` polyfills that modern browsers skip.
 * Sizes are gzipped, like the old `next build` column; growth is measured on gzip size.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

function parseArgs(argv) {
  const options = { dir: process.cwd(), json: null, base: null, threshold: 10 };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--help" || flag === "-h") {
      console.log(
        "Usage: bundle-size [--dir <project>] [--json <out.json>] [--base <base.json>] [--threshold <percent>]",
      );
      process.exit(0);
    }
    if (!["--dir", "--json", "--base", "--threshold"].includes(flag) || value === undefined) {
      console.error(`Unknown or incomplete option: ${flag}`);
      process.exit(2);
    }
    index++;
    if (flag === "--dir") options.dir = path.resolve(value);
    if (flag === "--json") options.json = path.resolve(value);
    if (flag === "--base") options.base = path.resolve(value);
    if (flag === "--threshold") options.threshold = Number(value);
  }
  return options;
}

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** Evaluates a `*_client-reference-manifest.js` file in an empty context and returns its entry. */
function readClientManifest(file, pageKey) {
  const context = {};
  vm.runInNewContext(readFileSync(file, "utf8"), context, { filename: file });
  return context.__RSC_MANIFEST?.[pageKey];
}

/** "/(studio)/colors/page" -> "/colors", "/(marketing)/page" -> "/". */
function routeFor(pageKey, routesManifest) {
  return routesManifest[pageKey] ?? (pageKey.replace(/\/page$/, "").replace(/\/\([^/]+\)/g, "") || "/");
}

/** Entry chunks of the page itself; the built-in 404 page is keyed by `app/not-found`. */
function pageEntryFiles(manifest, pageKey) {
  const keys = [`[project]/app${pageKey}`];
  if (pageKey === "/_not-found/page") keys.push("[project]/app/not-found");
  for (const key of keys) if (manifest.entryJSFiles?.[key]) return manifest.entryJSFiles[key];
  return null;
}

function measure(dir) {
  const nextDir = path.join(dir, ".next");
  if (!existsSync(path.join(nextDir, "build-manifest.json"))) {
    throw new Error(`No build found in ${nextDir}. Run \`pnpm build\` first.`);
  }
  const buildManifest = readJson(path.join(nextDir, "build-manifest.json"));
  const routesManifest = readJson(path.join(nextDir, "app-path-routes-manifest.json"));
  const sizes = new Map();
  const sizeOf = (file) => {
    if (!sizes.has(file)) {
      const contents = readFileSync(path.join(nextDir, file));
      sizes.set(file, { raw: contents.length, gzip: gzipSync(contents, { level: 9 }).length });
    }
    return sizes.get(file);
  };

  const routes = {};
  // _global-error only renders when the root layout throws, so it is not a page anyone lands on.
  const pageKeys = Object.keys(routesManifest).filter((key) => key.endsWith("/page") && key !== "/_global-error/page");
  for (const pageKey of pageKeys.sort()) {
    const manifestFile = path.join(nextDir, "server", "app", `${pageKey}_client-reference-manifest.js`);
    if (!existsSync(manifestFile)) throw new Error(`Missing client reference manifest for ${pageKey}`);
    const entryFiles = pageEntryFiles(readClientManifest(manifestFile, pageKey) ?? {}, pageKey);
    if (!entryFiles) throw new Error(`No entry JS files for ${pageKey} in ${manifestFile}`);
    const files = [...new Set([...buildManifest.rootMainFiles, ...entryFiles])].filter((file) => file.endsWith(".js"));
    const total = files.reduce(
      (sum, file) => {
        const size = sizeOf(file);
        return { raw: sum.raw + size.raw, gzip: sum.gzip + size.gzip };
      },
      { raw: 0, gzip: 0 },
    );
    routes[routeFor(pageKey, routesManifest)] = { ...total, files: files.length };
  }
  return { buildId: readFileSync(path.join(nextDir, "BUILD_ID"), "utf8").trim(), routes };
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
/** Small changes in bytes, so a few bytes never read as "+0.0 kB". */
const change = (bytes) => (bytes < 1024 ? `${bytes} B` : kb(bytes));

function signed(value, format) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${format(Math.abs(value))}`;
}

/** Builds the comparison rows and a markdown table. */
function compare(current, base, threshold) {
  const names = [...new Set([...Object.keys(current.routes), ...Object.keys(base?.routes ?? {})])].sort();
  const rows = names.map((route) => {
    const now = current.routes[route];
    const before = base?.routes[route];
    if (!now) return { route, status: "removed", cells: [route, "", "", `removed (was ${kb(before.gzip)})`, "ok"] };
    // A new route has nothing to grow from, so it never fails the check.
    if (!before) return { route, status: "ok", cells: [route, kb(now.gzip), kb(now.raw), "new", "ok"] };
    const delta = now.gzip - before.gzip;
    const percent = before.gzip ? (delta / before.gzip) * 100 : 0;
    const failed = percent > threshold;
    return {
      route,
      status: failed ? "failed" : "ok",
      cells: [
        route,
        kb(now.gzip),
        kb(now.raw),
        delta === 0 ? "0" : `${signed(delta, change)} (${signed(percent, (value) => value.toFixed(1))}%)`,
        failed ? "fail" : "ok",
      ],
    };
  });
  const header = base
    ? ["Route", "First-load JS (gzip)", "Raw", "Change vs base", "Status"]
    : ["Route", "First-load JS (gzip)", "Raw"];
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map((_, index) => (index === 0 ? "---" : "---:")).join(" | ")} |`,
    ...rows.map(
      (row) =>
        `| ${row.cells
          .slice(0, header.length)
          .map((cell, index) => (index === 0 ? `\`${cell}\`` : cell))
          .join(" | ")} |`,
    ),
  ];
  return { rows, markdown: lines.join("\n") };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(options.threshold) || options.threshold < 0) {
    console.error("--threshold must be a non-negative number");
    process.exit(2);
  }
  const current = measure(options.dir);
  if (options.json) writeFileSync(options.json, `${JSON.stringify(current, null, 2)}\n`);

  const base = options.base ? readJson(options.base) : null;
  const { rows, markdown } = compare(current, base, options.threshold);
  const failed = rows.filter((row) => row.status === "failed");
  const verdict = !base
    ? ""
    : failed.length
      ? `**${failed.length} route(s) grew by more than ${options.threshold}%:** ${failed.map((row) => `\`${row.route}\``).join(", ")}.`
      : `No route grew by more than ${options.threshold}%.`;
  const report = ["## Bundle size", "", "First-load client JS per route.", "", markdown, "", verdict].join("\n").trim();

  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  if (failed.length) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
