import { describe, expect, test } from "vitest";

import { advisoriesOf, failing, summary } from "../../scripts/audit-summary.mjs";

const report = {
  advisories: {
    "1": {
      module_name: "next",
      severity: "moderate",
      title: "Info disclosure",
      vulnerable_versions: ">=16.3.0 <=16.4.4",
      url: "https://github.com/advisories/GHSA-x",
    },
    "2": {
      module_name: "left-pad",
      severity: "high",
      title: "Bad | pipe",
      vulnerable_versions: "<2",
      url: "https://example.test/2",
    },
    "3": {
      module_name: "abc",
      severity: "critical",
      title: "Worse",
      vulnerable_versions: "*",
      url: "https://example.test/3",
    },
  },
};

describe("the audit summary", () => {
  test("lists advisories most severe first", () => {
    expect(advisoriesOf(report).map((item) => item.name)).toEqual(["abc", "left-pad", "next"]);
  });

  test("only high and critical advisories fail", () => {
    expect(failing(advisoriesOf(report)).map((item) => item.name)).toEqual(["abc", "left-pad"]);
    expect(failing(advisoriesOf({ advisories: { "1": report.advisories["1"] } }))).toEqual([]);
  });

  test("the table names the package, and a pipe in a title is escaped", () => {
    const text = summary(advisoriesOf(report));
    expect(text).toContain("| next | moderate | Info disclosure | >=16.3.0 <=16.4.4 |");
    expect(text).toContain("Bad \\| pipe");
  });

  test("no advisory, or no report, is a clean summary", () => {
    expect(summary(advisoriesOf({ advisories: {} }))).toContain("No known advisory");
    expect(advisoriesOf(undefined)).toEqual([]);
  });
});
