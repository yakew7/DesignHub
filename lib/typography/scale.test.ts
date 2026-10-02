import { describe, expect, test } from "vitest";

import { fluidClamp, generateScale, sizeAtViewport, stepName } from "@/lib/typography/scale";
import type { TypeScaleSettings } from "@/types/typography";

const settings: TypeScaleSettings = {
  baseSize: 16,
  ratio: 1.25,
  minBase: 16,
  minRatio: 1.25,
  minViewport: 320,
  maxViewport: 1280,
  stepsUp: 3,
  stepsDown: 2,
};

/** Evaluates a `clamp(min, Arem + Bvw, max)` string at a viewport width, in px. */
function evaluateClamp(clamp: string, viewport: number, rootPx = 16): number {
  const match = clamp.match(/^clamp\(([\d.-]+)rem, ([\d.-]+)rem \+ ([\d.-]+)vw, ([\d.-]+)rem\)$/);
  if (!match) throw new Error(`Not a fluid clamp: ${clamp}`);
  const [lower, intercept, slope, upper] = match.slice(1).map(Number) as [number, number, number, number];
  const preferred = intercept * rootPx + (slope / 100) * viewport;
  return Math.min(Math.max(preferred, lower * rootPx), upper * rootPx);
}

describe("generateScale", () => {
  test("a 1.25 ratio at base 16 gives the major third scale", () => {
    const steps = generateScale(settings);
    expect(steps.map((step) => step.step)).toEqual([3, 2, 1, 0, -1, -2]);
    expect(steps.map((step) => step.maxPx)).toEqual([31.25, 25, 20, 16, 12.8, 10.24]);
    expect(steps.map((step) => step.name)).toEqual(["2xl", "xl", "lg", "base", "sm", "xs"]);
  });

  test("equal min and max sizes collapse to a fixed rem value", () => {
    const base = generateScale(settings).find((step) => step.step === 0);
    expect(base?.clamp).toBe("1rem");
  });

  test("fluid steps hit the min size at the min viewport and the max size at the max viewport", () => {
    const steps = generateScale({ ...settings, minBase: 14, minRatio: 1.2 });
    for (const step of steps) {
      expect(evaluateClamp(step.clamp, settings.minViewport)).toBeCloseTo(step.minPx, 1);
      expect(evaluateClamp(step.clamp, settings.maxViewport)).toBeCloseTo(step.maxPx, 1);
    }
  });
});

describe("fluidClamp", () => {
  test("builds a rem clamp from px sizes", () => {
    expect(fluidClamp(16, 20, 320, 1280)).toBe("clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)");
  });

  test("clamps to the min below the min viewport and to the max above the max viewport", () => {
    const clamp = fluidClamp(16, 20, 320, 1280);
    expect(evaluateClamp(clamp, 320)).toBeCloseTo(16, 2);
    expect(evaluateClamp(clamp, 1280)).toBeCloseTo(20, 2);
    expect(evaluateClamp(clamp, 100)).toBe(16);
    expect(evaluateClamp(clamp, 2000)).toBe(20);
  });

  test("keeps the bounds ordered when the size shrinks with the viewport", () => {
    expect(fluidClamp(20, 16, 320, 1280)).toMatch(/^clamp\(1rem, .+, 1\.25rem\)$/);
  });

  test("falls back to the max size for an empty viewport range", () => {
    expect(fluidClamp(16, 20, 1280, 1280)).toBe("1.25rem");
  });
});

describe("sizeAtViewport", () => {
  const step = { name: "lg", step: 1, minPx: 16, maxPx: 20, clamp: "" };

  test("returns the min and max sizes at and beyond the viewport bounds", () => {
    expect(sizeAtViewport(step, 320, settings)).toBe(16);
    expect(sizeAtViewport(step, 200, settings)).toBe(16);
    expect(sizeAtViewport(step, 1280, settings)).toBe(20);
    expect(sizeAtViewport(step, 1600, settings)).toBe(20);
  });

  test("interpolates linearly in between", () => {
    expect(sizeAtViewport(step, 800, settings)).toBe(18);
  });
});

describe("stepName", () => {
  test.each([
    [-3, "2xs"],
    [-2, "xs"],
    [-1, "sm"],
    [0, "base"],
    [1, "lg"],
    [2, "xl"],
    [3, "2xl"],
    [8, "7xl"],
  ])("step %i is %s", (step, name) => {
    expect(stepName(step)).toBe(name);
  });

  test("names steps beyond the table", () => {
    expect(stepName(9)).toBe("8xl");
    expect(stepName(-4)).toBe("4xs");
  });
});
