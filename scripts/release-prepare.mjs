#!/usr/bin/env node
/**
 * Prepares a release: moves the `Unreleased` CHANGELOG entries under a new
 * version heading, sets the version in `package.json` and `lib/site.ts`, and
 * adds the release to the README roadmap:
 *
 *   pnpm release:prepare 1.3.0 "the Icon studio in Spanish, French and Hindi"
 *
 * It prints the commands that tag and publish the release, and runs nothing
 * that publishes: a release published with empty notes gets them filled from
 * the new CHANGELOG section by the release workflow.
 */
import { readFile, writeFile } from "node:fs/promises";

/** True when `candidate` is a newer semantic version than `current`. */
export function isNewerVersion(candidate, current) {
  const next = parseVersion(candidate);
  const prev = parseVersion(current);
  for (let index = 0; index < 3; index += 1) {
    if (next[index] !== prev[index]) return next[index] > prev[index];
  }
  return false;
}

function parseVersion(version) {
  const clean = String(version).replace(/^v/, "");
  const parts = clean.split(".");
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) {
    throw new Error(`"${version}" is not a semantic version (major.minor.patch).`);
  }
  return parts.map(Number);
}

/**
 * The changelog with `Unreleased` renamed to the new version and a new empty
 * `Unreleased` above it, carrying the same `### ` subsections. Refuses a
 * changelog with no `Unreleased` heading, and one with nothing under it.
 */
export function prepareChangelog(changelog, version, date) {
  const clean = String(version).replace(/^v/, "");
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => /^## Unreleased(\s|$)/.test(line));
  if (start < 0) throw new Error("CHANGELOG.md has no `## Unreleased` heading.");
  let end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  if (end < 0) end = lines.length;
  const body = lines.slice(start + 1, end);
  const hasEntry = body.some((line) => line.trim() !== "" && !/^### /.test(line));
  if (!hasEntry) {
    throw new Error("CHANGELOG.md has nothing under `## Unreleased` to release.");
  }
  const subsections = [...new Set(body.filter((line) => /^### /.test(line)))];
  const empty = ["## Unreleased", "", ...subsections.flatMap((heading) => [heading, ""])];
  return [...lines.slice(0, start), ...empty, `## v${clean} - ${date}`, ...body, ...lines.slice(end)].join("\n");
}

/** The package.json text with its version set. */
export function setPackageVersion(packageJson, version) {
  const clean = String(version).replace(/^v/, "");
  let data;
  try {
    data = JSON.parse(packageJson);
  } catch {
    throw new Error("package.json is not valid JSON.");
  }
  data.version = clean;
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** The lib/site.ts text with its `version: "..."` line set. */
export function setSiteVersion(siteTs, version) {
  const clean = String(version).replace(/^v/, "");
  const lines = siteTs.split("\n");
  const at = lines.findIndex((line) => /^\s*version:\s*"[^"]*",?\s*$/.test(line));
  if (at < 0) throw new Error('lib/site.ts has no `version: "..."` line.');
  lines[at] = lines[at].replace(/"[^"]*"/, `"${clean}"`);
  return lines.join("\n");
}

/**
 * The README text with a `- **<version>** - <text> ✅` roadmap line added in
 * version order, before the first newer release (or the `(next)` line).
 * Refuses a line for the same version, and a README with no roadmap lines.
 */
export function addRoadmapLine(readme, version, text) {
  const clean = String(version).replace(/^v/, "");
  const lines = readme.split("\n");
  const released = /^- \*\*(\d+\.\d+\.\d+)\*\* - /;
  const upcoming = /^- \*\*(\d+\.\d+\.\d+) \(next\)\*\* - /;
  const versionOf = (line) => {
    const match = line.match(released) ?? line.match(upcoming);
    return match === null ? null : match[1];
  };
  if (lines.some((line) => versionOf(line) === clean)) {
    throw new Error(`README.md already has a roadmap line for ${clean}.`);
  }
  const line = `- **${clean}** - ${text} ✅`;
  const at = lines.findIndex((candidate) => {
    const other = versionOf(candidate);
    return other !== null && isNewerVersion(other, clean);
  });
  if (at >= 0) {
    lines.splice(at, 0, line);
  } else {
    const last = lines.findLastIndex((candidate) => released.test(candidate));
    if (last < 0) throw new Error("README.md has no roadmap release lines.");
    lines.splice(last + 1, 0, line);
  }
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [version, roadmapText] = process.argv.slice(2);
  if (!version || !roadmapText) {
    console.error(
      'Usage: pnpm release:prepare <version> "<roadmap text>"\n' +
        'Example: pnpm release:prepare 1.3.0 "the Icon studio in Spanish, French and Hindi"',
    );
    process.exit(2);
  }
  const tag = `v${String(version).replace(/^v/, "")}`;
  try {
    const changelog = await readFile("CHANGELOG.md", "utf8");
    const packageJson = await readFile("package.json", "utf8");
    const siteTs = await readFile("lib/site.ts", "utf8");
    const readme = await readFile("README.md", "utf8");
    let current;
    try {
      current = JSON.parse(packageJson).version;
    } catch {
      throw new Error("package.json is not valid JSON.");
    }
    if (typeof current !== "string" || !isNewerVersion(version, current)) {
      throw new Error(`"${version}" is not newer than the current version ${current ?? "(none)"}.`);
    }
    const date = new Date().toISOString().slice(0, 10);
    const nextChangelog = prepareChangelog(changelog, version, date);
    const nextPackage = setPackageVersion(packageJson, version);
    const nextSite = setSiteVersion(siteTs, version);
    const nextReadme = addRoadmapLine(readme, version, roadmapText);
    await writeFile("CHANGELOG.md", nextChangelog);
    await writeFile("package.json", nextPackage);
    await writeFile("lib/site.ts", nextSite);
    await writeFile("README.md", nextReadme);
    console.log(`Prepared ${tag}:`);
    console.log(`  git tag ${tag}`);
    console.log(`  git push origin ${tag}`);
    console.log(`  gh release create ${tag} --notes ""`);
    console.log("The release workflow fills the empty notes from the new CHANGELOG section.");
  } catch (error) {
    console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
