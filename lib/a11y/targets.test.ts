import { describe, expect, test } from "vitest";

import { evaluateTargets, targetsSection } from "@/lib/a11y/targets";
import type { TouchTarget } from "@/types/a11y";

function target(size: number, label = `${size}px`): TouchTarget {
  return { id: label, label, width: size, height: size };
}

describe("evaluateTargets", () => {
  test("a 44px target passes AAA and AA", () => {
    const [result] = evaluateTargets([target(44)], 0);
    expect(result?.aaa).toBe(true);
    expect(result?.aa).toBe(true);
    expect(result?.reason).toMatch(/AAA/);
  });

  test("a target 44px wide but 30px tall misses AAA", () => {
    const [result] = evaluateTargets([{ id: "a", label: "a", width: 44, height: 30 }], 0);
    expect(result?.aaa).toBe(false);
    expect(result?.aa).toBe(true);
  });

  test("24px targets pass AA but not AAA, even with no gap", () => {
    const results = evaluateTargets([target(24, "a"), target(24, "b")], 0);
    for (const result of results) {
      expect(result.aa).toBe(true);
      expect(result.aaa).toBe(false);
    }
  });

  test("20px targets fail when packed tightly", () => {
    const results = evaluateTargets([target(20, "a"), target(20, "b")], 2);
    expect(results.map((result) => result.aa)).toEqual([false, false]);
    expect(results[0]?.reason).toMatch(/too small/i);
  });

  test("20px targets pass AA through the spacing exception", () => {
    // Centers are 20/2 + 4 + 20/2 = 24px apart, so the 24px circles do not overlap.
    const results = evaluateTargets([target(20, "a"), target(20, "b")], 4);
    expect(results.map((result) => result.aa)).toEqual([true, true]);
    expect(results[0]?.reason).toMatch(/spacing exception/);
  });

  test("an undersized target's circle must not reach a large neighbor", () => {
    // The circle has a 12px radius but the large neighbor starts 10/2 + 4 = 9px from the center.
    const [tight] = evaluateTargets([target(10, "small"), target(44, "big")], 4);
    expect(tight?.aa).toBe(false);
    const [spaced] = evaluateTargets([target(10, "small"), target(44, "big")], 7);
    expect(spaced?.aa).toBe(true);
  });

  test("a lone undersized target passes AA", () => {
    const [result] = evaluateTargets([target(16)], 0);
    expect(result?.aa).toBe(true);
    expect(result?.aaa).toBe(false);
  });

  test("only direct neighbors in the row count", () => {
    const results = evaluateTargets([target(20, "a"), target(44, "b"), target(20, "c")], 2);
    expect(results.map((result) => result.aa)).toEqual([true, true, true]);
  });
});

describe("targetsSection", () => {
  test("summarises each target for the report", () => {
    const section = targetsSection([target(44, "Button"), target(20, "Icon")], 0);
    expect(section.gap).toBe(0);
    expect(section.results[0]).toMatchObject({
      label: "Button",
      size: "44×44",
      "WCAG 2.5.8 (AA)": true,
      "WCAG 2.5.5 (AAA)": true,
    });
    expect(section.results[1]).toMatchObject({ label: "Icon", "WCAG 2.5.8 (AA)": false, "WCAG 2.5.5 (AAA)": false });
  });
});
