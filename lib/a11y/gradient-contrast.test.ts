import { describe, expect, test } from "vitest";

import {
  GRADIENT_SAMPLES,
  gradientSection,
  gradientTextColors,
  gradientTextContrast,
  samplePositions,
} from "@/lib/a11y/gradient-contrast";
import { contrastRatio, fromHex, toHex } from "@/lib/color/color";
import { colorAt, createStop } from "@/lib/color/gradient";
import type { Gradient } from "@/types/color";

function gradient(stops: [string, number][], interpolation: Gradient["interpolation"] = "srgb"): Gradient {
  return {
    type: "linear",
    angle: 90,
    x: 50,
    y: 50,
    interpolation,
    stops: stops.map(([hex, position]) => createStop(fromHex(hex), position)),
  };
}

const colors = gradientTextColors("#1f2937");
const byId = (results: ReturnType<typeof gradientTextContrast>, id: string) => results.find((item) => item.id === id)!;

describe("samplePositions", () => {
  test("takes at least 32 evenly spaced points from end to end", () => {
    const positions = samplePositions(
      gradient([
        ["#000000", 0],
        ["#ffffff", 100],
      ]),
    );
    expect(positions.length).toBeGreaterThanOrEqual(32);
    expect(positions.length).toBe(GRADIENT_SAMPLES);
    expect(positions[0]).toBe(0);
    expect(positions[positions.length - 1]).toBe(100);
    expect(
      samplePositions(
        gradient([
          ["#000000", 0],
          ["#ffffff", 100],
        ]),
        8,
      ),
    ).toHaveLength(32);
  });
});

describe("gradientTextContrast", () => {
  // Mixed in sRGB, blue and red pass through a muddy purple that is darker than either end.
  const blueToRed = gradient([
    ["#0000ff", 0],
    ["#ff0000", 100],
  ]);
  const results = gradientTextContrast(blueToRed, colors);
  const ratioAt = (hex: string, position: number) => contrastRatio(fromHex(hex), colorAt(blueToRed, position));

  test("finds the worst point in the middle of a two-stop gradient", () => {
    const black = byId(results, "black");
    expect(black.worstPosition).toBeGreaterThan(0);
    expect(black.worstPosition).toBeLessThan(100);
    expect(black.worstRatio).toBeLessThan(ratioAt("#000000", 0));
    expect(black.worstRatio).toBeLessThan(ratioAt("#000000", 100));
    expect(black.pass).toBe(false);

    // A brute-force scan agrees to within one sampling step.
    const fine = Array.from({ length: 1001 }, (_, index) => index / 10);
    const minimum = fine.reduce((best, position) =>
      ratioAt("#000000", position) < ratioAt("#000000", best) ? position : best,
    );
    expect(Math.abs(black.worstPosition - minimum)).toBeLessThanOrEqual(100 / (GRADIENT_SAMPLES - 1));
    expect(black.worstRatio - ratioAt("#000000", minimum)).toBeLessThan(0.01);
  });

  test("finds the lightest end for white text", () => {
    const white = byId(results, "white");
    expect(white.worstPosition).toBe(100);
    expect(white.worstBackground).toBe("#ff0000");
    expect(white.pass).toBe(false);
    expect(white.passLarge).toBe(true);
  });

  test("samples in the gradient's own interpolation space", () => {
    const oklab = gradient(
      [
        ["#0000ff", 0],
        ["#ff0000", 100],
      ],
      "oklab",
    );
    expect(toHex(colorAt(blueToRed, 50))).toMatch(/^#(7f|80)0080$/);
    expect(toHex(colorAt(oklab, 50))).not.toMatch(/^#(7f|80)0080$/);
    // OKLab keeps the middle lighter than sRGB's muddy purple, so black text does better there.
    const black = byId(gradientTextContrast(oklab, colors), "black");
    expect(black.worstRatio).toBeGreaterThan(byId(results, "black").worstRatio);
  });

  test("passes text that clears 4.5:1 everywhere", () => {
    const light = gradient([
      ["#ffffff", 0],
      ["#e0f2fe", 100],
    ]);
    const black = byId(gradientTextContrast(light, colors), "black");
    expect(black.pass).toBe(true);
    expect(black.worstPosition).toBe(100);
  });

  test("reports rounded numbers in the JSON section", () => {
    const section = gradientSection(blueToRed, results);
    expect(section.samples).toBe(GRADIENT_SAMPLES);
    expect(section.interpolation).toBe("srgb");
    expect(section.results.map((item) => item.text)).toEqual(["White", "Black", "Brand text"]);
    for (const item of section.results) expect(item.worstRatio).toBe(Math.floor(item.worstRatio * 100) / 100);
  });
});
