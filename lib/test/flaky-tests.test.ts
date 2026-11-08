import { describe, expect, test } from "vitest";

import { failedRuns, repeatSummary, retriedTests, summary } from "../../scripts/flaky-tests.mjs";

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
