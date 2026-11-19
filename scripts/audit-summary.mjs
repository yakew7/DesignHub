#!/usr/bin/env node
/**
 * Turns the JSON of `pnpm audit --prod --json` into a Markdown table for the job summary, and fails for an advisory
 * of high or critical severity (a moderate or lower one is listed and does not fail):
 *
 *   pnpm audit --prod --json > audit.json || true
 *   node scripts/audit-summary.mjs audit.json >> "$GITHUB_STEP_SUMMARY"
 *
 * Output that is not audit JSON (the registry could not be reached) is reported and does not fail the job.
 */
import { readFile } from "node:fs/promises";

const SEVERITIES = ["critical", "high", "moderate", "low", "info"];

/** The advisories of a parsed audit report, most severe first. */
export function advisoriesOf(report) {
  const list = Object.values(report?.advisories ?? {}).map((item) => ({
    name: String(item.module_name ?? item.name ?? "unknown"),
    severity: String(item.severity ?? "info"),
    title: String(item.title ?? ""),
    range: String(item.vulnerable_versions ?? ""),
    url: String(item.url ?? ""),
  }));
  return list.sort(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || a.name.localeCompare(b.name),
  );
}

/** The advisories that fail the job: high and critical. */
export const failing = (list) => list.filter((item) => item.severity === "high" || item.severity === "critical");

export function summary(list) {
  if (list.length === 0) return "### Dependency advisories\n\nNo known advisory in the production dependencies.\n";
  const rows = list.map(
    (item) =>
      `| ${item.name} | ${item.severity} | ${item.title.replaceAll("|", "\\|")} | ${item.range.replaceAll("|", "\\|")} | ${item.url} |`,
  );
  return [
    "### Dependency advisories",
    "",
    `${list.length} advisory in the production dependencies. High and critical ones fail the job.`,
    "",
    "| Package | Severity | Advisory | Affected versions | Link |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let report;
  try {
    report = JSON.parse(await readFile(process.argv[2] ?? "audit.json", "utf8"));
  } catch {
    console.log(
      "### Dependency advisories\n\nThe audit could not be read (the registry may be unreachable), so nothing was checked.\n",
    );
    process.exit(0);
  }
  const list = advisoriesOf(report);
  console.log(summary(list));
  for (const item of failing(list))
    console.error(`::error::${item.severity} advisory in ${item.name}: ${item.title} ${item.url}`);
  if (failing(list).length > 0) process.exit(1);
}
