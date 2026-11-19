#!/usr/bin/env node
/**
 * Prints the CHANGELOG section of a release, for the release notes:
 *
 *   node scripts/release-notes.mjs v1.2.0 [CHANGELOG.md]
 *
 * The section starts at the heading `## v1.2.0` (the heading may carry a date, `## v1.2.0 - 2026-11-08`, and the tag may
 * be written with or without the v) and ends before the next `## ` heading. Without the section the script says so
 * and exits 1, so a release is not published with notes from nowhere.
 */
import { readFile } from "node:fs/promises";

/** The text of a release's section (its headings of the next level included, its own heading not), or null. */
export function sectionFor(changelog, tag) {
  const version = tag.replace(/^v/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^## v?${version}(\\s|$)`).test(line));
  if (start < 0) return null;
  let end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  if (end < 0) end = lines.length;
  const text = lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
  return text === "" ? null : `${text}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tag = process.argv[2];
  if (!tag) {
    console.error("Usage: node scripts/release-notes.mjs <tag> [CHANGELOG.md]");
    process.exit(2);
  }
  const section = sectionFor(await readFile(process.argv[3] ?? "CHANGELOG.md", "utf8"), tag);
  if (section === null) {
    console.error(
      `::error::CHANGELOG.md has no section for ${tag}. Add "## ${tag}" with the changes before publishing the release.`,
    );
    process.exit(1);
  }
  process.stdout.write(section);
}
