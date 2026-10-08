import { describe, expect, test } from "vitest";

import { oklch } from "@/lib/color/color";
import { SHADE_STEPS, generateShades, nearestStep } from "@/lib/color/shades";
import type { Oklch } from "@/types/color";

const bases: [string, Oklch][] = [
  ["indigo", oklch(0.55, 0.22, 275)],
  ["near white", oklch(0.99, 0.02, 90)],
  ["near black", oklch(0.12, 0.04, 250)],
  ["pure white", oklch(1, 0, 0)],
  ["pure black", oklch(0, 0, 0)],
  ["gray", oklch(0.6, 0, 0)],
  ["vivid pale yellow", oklch(0.95, 0.2, 100)],
  ["between two steps", oklch(0.66, 0.15, 30)],
];

describe("nearestStep", () => {
  test.each([
    [0.975, 50],
    [1, 50],
    [0.625, 500],
    [0.6, 500],
    [0.51, 700],
    [0.26, 950],
    [0, 950],
  ] as const)("lightness %f maps to step %i", (l, step) => {
    expect(nearestStep(oklch(l, 0.1, 200))).toBe(step);
  });
});

describe("generateShades", () => {
  test("returns one shade per step, in order", () => {
    const shades = generateShades(oklch(0.6, 0.15, 200));
    expect(shades.map((shade) => shade.step)).toEqual([...SHADE_STEPS]);
  });

  test.each(bases)("shades of %s get lighter from 950 to 50", (_, base) => {
    for (const anchor of [true, false]) {
      for (const hueShift of [0, 30, -45]) {
        const lightness = generateShades(base, { anchor, hueShift }).map((shade) => shade.color.l);
        for (let i = 1; i < lightness.length; i += 1) {
          // Step i is one notch darker than step i - 1 (50 comes first, 950 last).
          expect(lightness[i]).toBeLessThan(lightness[i - 1] ?? Infinity);
        }
      }
    }
  });

  test.each(bases)("anchoring keeps %s exactly on its nearest step", (_, base) => {
    const shades = generateShades(base, { anchor: true, hueShift: 20 });
    const anchored = shades.find((shade) => shade.step === nearestStep(base));
    expect(anchored?.color).toEqual(base);
  });

  test("without anchoring, the nearest step is regenerated rather than copied", () => {
    const base = oklch(0.66, 0.15, 30);
    const shade = generateShades(base, { anchor: false, hueShift: 0 }).find((item) => item.step === nearestStep(base));
    expect(shade?.color.l).not.toBe(base.l);
  });

  test("keeps the base hue with no hue shift, and spreads a shift across the scale", () => {
    const base = oklch(0.6, 0.15, 200);
    for (const shade of generateShades(base)) expect(shade.color.h).toBeCloseTo(200);

    const shifted = generateShades(base, { anchor: false, hueShift: 40 });
    expect(shifted[0]?.color.h).toBeCloseTo(180);
    expect(shifted[shifted.length - 1]?.color.h).toBeCloseTo(220);
  });

  test("chroma never exceeds the displayable cap, and alpha is kept", () => {
    for (const shade of generateShades(oklch(0.97, 0.3, 140, 0.5))) {
      expect(shade.color.c).toBeLessThanOrEqual(0.37);
      expect(shade.color.alpha).toBe(0.5);
    }
  });

  test("a gray input stays gray", () => {
    for (const shade of generateShades(oklch(0.6, 0, 0))) expect(shade.color.c).toBe(0);
  });
});
