import { describe, expect, test } from "vitest";

import { oklch, parseColor } from "@/lib/color/color";
import { OKLCH, sRGB_Linear, to } from "@/lib/color/engine";
import { simulateVision, visionMatrices, type VisionType } from "@/lib/color/vision";
import type { Oklch } from "@/types/color";

const simulated: VisionType[] = ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"];

/** Linear sRGB channels of an OKLCH color, to compare with the published matrices. */
function linear(color: Oklch): number[] {
  return to({ space: OKLCH, coords: [color.l, color.c, color.h], alpha: 1 }, sRGB_Linear).coords.map(
    (value) => value ?? 0,
  );
}

function color(css: string): Oklch {
  const parsed = parseColor(css);
  if (!parsed) throw new Error(`Could not parse ${css}`);
  return parsed;
}

describe("simulateVision", () => {
  test("typical vision returns the color untouched", () => {
    const input = oklch(0.6, 0.2, 30, 0.4);
    expect(simulateVision(input, "normal")).toBe(input);
  });

  test.each(simulated)("grays stay gray under %s", (type) => {
    for (const l of [0, 0.2, 0.45, 0.7, 0.9, 1]) {
      const result = simulateVision(oklch(l, 0, 0), type);
      expect(result.c).toBeLessThan(1e-4);
      expect(result.l).toBeCloseTo(l, 4);
    }
  });

  test.each(simulated)("%s keeps alpha and returns a valid color", (type) => {
    const result = simulateVision(oklch(0.7, 0.3, 140, 0.25), type);
    expect(result.alpha).toBe(0.25);
    expect(result.l).toBeGreaterThanOrEqual(0);
    expect(result.l).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.h)).toBe(true);
  });

  /*
   * Reference values: Machado, Oliveira and Fernandes, "A Physiologically-based Model for
   * Simulation of Color Vision Deficiency", IEEE TVCG 15(6), 2009, severity 1.0 matrices
   * (https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html).
   * A primary in linear sRGB picks out one column of the matrix, so pure red under
   * protanopia is (0.152286, 0.114503, -0.003882), and the negative channel clamps to 0.
   */
  test.each([
    ["protanopia", "#ff0000", [0.152286, 0.114503, 0]],
    ["protanopia", "#0000ff", [0, 0.099216, 1]],
    ["deuteranopia", "#ff0000", [0.367322, 0.280085, 0]],
    ["deuteranopia", "#0000ff", [0, 0.047413, 0.968881]],
    ["tritanopia", "#0000ff", [0, 0.147602, 0.3039]],
    ["tritanopia", "#00ff00", [0, 0.930809, 0.691367]],
  ] as const)("%s maps %s to the published Machado 2009 values", (type, input, expected) => {
    const result = linear(simulateVision(color(input), type));
    expected.forEach((value, index) => expect(result[index]).toBeCloseTo(value, 3));
  });

  test("achromatopsia uses Rec. 709 relative luminance", () => {
    // Pure green has relative luminance 0.7152 (IEC 61966-2-1 / Rec. 709 coefficients).
    for (const channel of linear(simulateVision(color("#00ff00"), "achromatopsia"))) {
      expect(channel).toBeCloseTo(0.7152, 3);
    }
  });

  test("each matrix keeps white white (rows sum to 1)", () => {
    for (const matrix of Object.values(visionMatrices)) {
      for (let row = 0; row < 3; row += 1) {
        const sum = matrix.slice(row * 3, row * 3 + 3).reduce((total, value) => total + value, 0);
        expect(sum).toBeCloseTo(1, 5);
      }
    }
  });

  test("protanopia and deuteranopia bring red and green close in hue", () => {
    const red = color("#d62728");
    const green = color("#2ca02c");
    for (const type of ["protanopia", "deuteranopia"] as const) {
      const gap = Math.abs(simulateVision(red, type).h - simulateVision(green, type).h) % 360;
      expect(Math.min(gap, 360 - gap)).toBeLessThan(40);
    }
  });
});
