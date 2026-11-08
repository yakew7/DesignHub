#!/usr/bin/env node
/**
 * Lists the end-to-end tests that failed and then passed on a retry, from Playwright's JSON report, as a
 * Markdown table for the job summary and one warning annotation each:
 *   node scripts/flaky-tests.mjs test-results/report.json >> "$GITHUB_STEP_SUMMARY"
 * A test that needed a retry passes the job but is not fine: it is a test to fix.
 */
import { readFile } from "node:fs/promises";

/** Tests with more than one attempt whose last attempt passed, from a parsed Playwright JSON report. */
export function retriedTests(report) {
  const found = [];
  const visit = (suite, titles) => {
    const here = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const last = results.at(-1);
        if (results.length > 1 && last?.status === "passed") {
          found.push({
            title: [...here, spec.title].join(" › "),
            file: spec.file ?? suite.file ?? "",
            attempts: results.length,
          });
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child, here);
  };
  for (const suite of report.suites ?? []) visit(suite, []);
  return found;
}

/**
 * Tests with at least one failed run, from a report made with `--repeat-each` and no retries, with how many of their
 * runs failed. Each repeat is a run, so a test that fails two runs in ten is listed as 2 of 10.
 */
export function failedRuns(report) {
  const found = new Map();
  const visit = (suite, titles) => {
    const here = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      const title = [...here, spec.title].join(" › ");
      for (const test of spec.tests ?? []) {
        const entry = found.get(title) ?? { title, file: spec.file ?? suite.file ?? "", failed: 0, runs: 0 };
        const last = (test.results ?? []).at(-1);
        entry.runs += 1;
        if (last && last.status !== "passed" && last.status !== "skipped") entry.failed += 1;
        found.set(title, entry);
      }
    }
    for (const child of suite.suites ?? []) visit(child, here);
  };
  for (const suite of report.suites ?? []) visit(suite, []);
  return [...found.values()].filter((item) => item.failed > 0);
}

export function repeatSummary(found) {
  if (found.length === 0) return "### Repeated end-to-end run\n\nEvery run of every test passed.\n";
  const rows = found.map(
    (item) => `| \`${item.file}\` | ${item.title.replaceAll("|", "\\|")} | ${item.failed} of ${item.runs} |`,
  );
  return [
    "### Repeated end-to-end run",
    "",
    "These tests failed at least one run. Each is a flaky test to fix.",
    "",
    "| File | Test | Runs that failed |",
    "| --- | --- | ---: |",
    ...rows,
    "",
  ].join("\n");
}

export function summary(found) {
  if (found.length === 0) return "### End-to-end tests\n\nNo test needed a retry.\n";
  const rows = found.map((item) => `| \`${item.file}\` | ${item.title.replaceAll("|", "\\|")} | ${item.attempts} |`);
  return [
    "### End-to-end tests that needed a retry",
    "",
    "These passed, but only after failing at least once. Each is a flaky test to fix.",
    "",
    "| File | Test | Attempts |",
    "| --- | --- | ---: |",
    ...rows,
    "",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "test-results/report.json";
  const report = JSON.parse(await readFile(path, "utf8"));
  if (process.argv.includes("--repeat")) {
    const failed = failedRuns(report);
    for (const item of failed)
      console.error(`::warning file=${item.file}::Failed ${item.failed} of ${item.runs} runs: ${item.title}`);
    console.log(repeatSummary(failed));
    process.exit(0);
  }
  const found = retriedTests(report);
  for (const item of found) console.error(`::warning file=${item.file}::Needed a retry: ${item.title}`);
  console.log(summary(found));
}
