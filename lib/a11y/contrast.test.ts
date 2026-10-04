import { describe, expect, test } from "vitest";

import { focusIndicatorCheck, focusSection, FOCUS_RING_MIN } from "@/lib/a11y/contrast";
import { contrastRatio, fromHex } from "@/lib/color/color";

describe("focusIndicatorCheck", () => {
  test("passes a dark ring around a light button on a white page", () => {
    const check = focusIndicatorCheck("#1e1b4b", "#ffffff", "#c7d2fe");
    expect(check.backgroundRatio).toBeGreaterThanOrEqual(FOCUS_RING_MIN);
    expect(check.componentRatio).toBeGreaterThanOrEqual(FOCUS_RING_MIN);
    expect(check.pass).toBe(true);
    expect(check.suggestion).toBeNull();
  });

  test("fails a ring that matches the button and suggests one that clears 3:1 on both sides", () => {
    const check = focusIndicatorCheck("#4f46e5", "#ffffff", "#4f46e5");
    expect(check.backgroundRatio).toBeGreaterThanOrEqual(FOCUS_RING_MIN);
    expect(check.componentRatio).toBeCloseTo(1);
    expect(check.pass).toBe(false);
    expect(check.suggestion).toMatch(/^#[0-9a-f]{6}$/);
    const fixed = fromHex(check.suggestion ?? "");
    expect(contrastRatio(fixed, fromHex("#ffffff"))).toBeGreaterThanOrEqual(FOCUS_RING_MIN);
    expect(contrastRatio(fixed, fromHex("#4f46e5"))).toBeGreaterThanOrEqual(FOCUS_RING_MIN);
    expect(focusIndicatorCheck(check.suggestion ?? "", "#ffffff", "#4f46e5").pass).toBe(true);
  });

  test("fails a pale ring on a white page", () => {
    const check = focusIndicatorCheck("#c7d2fe", "#ffffff", "#1e1b4b");
    expect(check.backgroundRatio).toBeLessThan(FOCUS_RING_MIN);
    expect(check.pass).toBe(false);
  });

  test("reports truncated ratios in the JSON section", () => {
    const section = focusSection(focusIndicatorCheck("#767676", "#ffffff", "#000000"));
    expect(section.ratioAgainstBackground).toBe(4.54);
    expect(section.required).toBe(3);
    expect(section.pass).toBe(true);
  });
});
