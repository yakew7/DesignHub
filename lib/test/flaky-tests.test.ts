import { describe, expect, test } from "vitest";

import {
  failedRuns,
  repeatSummary,
  retriedTests,
  slowestSummary,
  summary,
  testDurations,
} from "../../scripts/flaky-tests.mjs";

const report = {
  suites: [
    {
      title: "a.spec.ts",
      file: "a.spec.ts",
      specs: [
        { title: "steady", file: "a.spec.ts", tests: [{ results: [{ status: "passed" }] }] },
        { title: "flaky", file: "a.spec.ts", tests: [{ results: [{ status: "failed" }, { status: "passed" }] }] },
        { title: "broken", file: "a.spec.ts", tests: [{ results: [{ status: "failed" }, { status: "failed" }] }] },
      ],
      suites: [
        {
          title: "group",
          specs: [
            {
              title: "nested",
              file: "a.spec.ts",
              tests: [{ results: [{ status: "timedOut" }, { status: "passed" }] }],
            },
          ],
        },
      ],
    },
  ],
};

describe("flaky test report", () => {
  test("finds only tests that failed and then passed, including nested ones", () => {
    expect(retriedTests(report).map((item) => item.title)).toEqual(["a.spec.ts › flaky", "a.spec.ts › group › nested"]);
  });

  test("the summary lists them, or says none needed a retry", () => {
    expect(summary(retriedTests(report))).toContain("| `a.spec.ts` | a.spec.ts › flaky | 2 |");
    expect(summary([])).toContain("No test needed a retry.");
  });

  test("a repeated run counts the failed runs of each test", () => {
    const repeated = {
      suites: [
        {
          title: "b.spec.ts",
          specs: [
            {
              title: "sometimes",
              file: "b.spec.ts",
              tests: [
                { results: [{ status: "passed" }] },
                { results: [{ status: "timedOut" }] },
                { results: [{ status: "passed" }] },
              ],
            },
            { title: "always", file: "b.spec.ts", tests: [{ results: [{ status: "passed" }] }] },
          ],
        },
      ],
    };
    const found = failedRuns(repeated);
    expect(found).toEqual([{ title: "b.spec.ts › sometimes", file: "b.spec.ts", failed: 1, runs: 3 }]);
    expect(repeatSummary(found)).toContain("| `b.spec.ts` | b.spec.ts › sometimes | 1 of 3 |");
    expect(repeatSummary([])).toContain("Every run of every test passed.");
  });
});

describe("slowest tests", () => {
  const timed = {
    suites: [
      {
        title: "c.spec.ts",
        file: "c.spec.ts",
        specs: [
          { title: "quick", file: "c.spec.ts", tests: [{ results: [{ status: "passed", duration: 400 }] }] },
          {
            title: "retried",
            file: "c.spec.ts",
            tests: [
              {
                results: [
                  { status: "failed", duration: 3000 },
                  { status: "passed", duration: 2500 },
                ],
              },
            ],
          },
          {
            title: "repeated",
            file: "c.spec.ts",
            tests: [
              { results: [{ status: "passed", duration: 1200 }] },
              { results: [{ status: "passed", duration: 4100 }] },
            ],
          },
        ],
        suites: [
          {
            title: "axe | studios",
            specs: [{ title: "home", file: "c.spec.ts", tests: [{ results: [{ status: "passed", duration: 900 }] }] }],
          },
        ],
      },
    ],
  };

  test("a test's time is its longest run with that run's retries added, slowest first", () => {
    expect(testDurations(timed)).toEqual([
      { title: "c.spec.ts › retried", file: "c.spec.ts", duration: 5500 },
      { title: "c.spec.ts › repeated", file: "c.spec.ts", duration: 4100 },
      { title: "c.spec.ts › axe | studios › home", file: "c.spec.ts", duration: 900 },
      { title: "c.spec.ts › quick", file: "c.spec.ts", duration: 400 },
    ]);
  });

  test("the table lists the slowest tests in seconds, at most the count asked for", () => {
    const table = slowestSummary(testDurations(timed), 2);
    expect(table).toContain("### Slowest 2 end-to-end tests");
    expect(table).toContain("| `c.spec.ts` | c.spec.ts › retried | 5.5 s |");
    expect(table).toContain("| `c.spec.ts` | c.spec.ts › repeated | 4.1 s |");
    expect(table).not.toContain("quick");
    expect(slowestSummary(testDurations(timed))).toContain(
      "| `c.spec.ts` | c.spec.ts › axe \\| studios › home | 0.9 s |",
    );
  });

  test("a report with no tests says so", () => {
    expect(slowestSummary(testDurations({ suites: [] }))).toContain("The report has no test times.");
  });
});
