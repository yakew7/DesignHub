import { describe, expect, test } from "vitest";

import { oklch } from "@/lib/color/color";
import { harmonyModes, harmonyOffsets, harmonyPalette } from "@/lib/color/harmony";
import type { HarmonyMode, Oklch } from "@/types/color";

const deterministicRandom = () => 0.5;

function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

describe("harmonyOffsets", () => {
  test("defines expected offsets for all structured harmony modes", () => {
    expect(harmonyOffsets.complementary).toEqual([0, 180]);
    expect(harmonyOffsets.triadic).toEqual([0, 120, 240]);
    expect(harmonyOffsets.tetradic).toEqual([0, 90, 180, 270]);
    expect(harmonyOffsets["split-complementary"]).toEqual([0, 150, 210]);
    expect(harmonyOffsets.analogous).toEqual([0, -30, 30, -60, 60]);
    expect(harmonyOffsets.monochromatic).toEqual([0]);
  });
});

describe("harmonyModes", () => {
  test("contains descriptive entries for all harmony modes", () => {
    const values = harmonyModes.map((item) => item.value);
    const expectedModes: HarmonyMode[] = [
      "random",
      "analogous",
      "complementary",
      "split-complementary",
      "triadic",
      "tetradic",
      "monochromatic",
    ];

    expect(values).toEqual(expectedModes);

    for (const mode of harmonyModes) {
      expect(mode.label.length).toBeGreaterThan(0);
      expect(mode.description.length).toBeGreaterThan(0);
    }
  });
});

describe("harmonyPalette", () => {
  const baseColor: Oklch = oklch(0.65, 0.18, 50);

  test("generates the requested number of colors", () => {
    expect(harmonyPalette("complementary", baseColor, 2, deterministicRandom)).toHaveLength(2);
    expect(harmonyPalette("triadic", baseColor, 3, deterministicRandom)).toHaveLength(3);
    expect(harmonyPalette("monochromatic", baseColor, 5, deterministicRandom)).toHaveLength(5);
    expect(harmonyPalette("tetradic", baseColor, 8, deterministicRandom)).toHaveLength(8);
  });

  test("preserves the base color at the designated baseIndex", () => {
    const count = 5;
    const lockedIndex = 2;
    const palette = harmonyPalette("triadic", baseColor, count, deterministicRandom, lockedIndex);

    expect(palette[lockedIndex]).toEqual(baseColor);
  });

  test("preserves the base color when baseIndex is at boundaries", () => {
    const paletteStart = harmonyPalette("complementary", baseColor, 4, deterministicRandom, 0);
    expect(paletteStart[0]).toEqual(baseColor);

    const paletteEnd = harmonyPalette("complementary", baseColor, 4, deterministicRandom, 3);
    expect(paletteEnd[3]).toEqual(baseColor);
  });

  test("produces complementary colors with 180 degrees angular separation", () => {
    const palette = harmonyPalette("complementary", baseColor, 2, deterministicRandom, 0);
    const generatedComplement = palette[1];

    expect(generatedComplement).toBeDefined();
    expect(hueDistance(baseColor.h, generatedComplement!.h)).toBeCloseTo(180, 5);
  });

  test("produces triadic colors with 120 degrees angular separation", () => {
    const palette = harmonyPalette("triadic", baseColor, 3, deterministicRandom, 0);
    const firstOffsetColor = palette[1];
    const secondOffsetColor = palette[2];

    expect(firstOffsetColor).toBeDefined();
    expect(secondOffsetColor).toBeDefined();
    expect(hueDistance(baseColor.h, firstOffsetColor!.h)).toBeCloseTo(120, 5);
    expect(hueDistance(baseColor.h, secondOffsetColor!.h)).toBeCloseTo(120, 5);
  });

  test("keeps base hue in monochromatic mode while varying lightness", () => {
    const count = 5;
    const palette = harmonyPalette("monochromatic", baseColor, count, deterministicRandom, 0);

    for (const swatch of palette) {
      expect(swatch.h).toBeCloseTo(baseColor.h, 5);
    }

    const generatedLightness = palette.slice(1).map((swatch) => swatch.l);
    for (let index = 1; index < generatedLightness.length; index += 1) {
      expect(generatedLightness[index]).toBeGreaterThan(generatedLightness[index - 1]!);
    }
  });

  test("produces tetradic colors following ninety degree steps", () => {
    const palette = harmonyPalette("tetradic", baseColor, 4, deterministicRandom, 0);

    expect(hueDistance(baseColor.h, palette[1]!.h)).toBeCloseTo(90, 5);
    expect(hueDistance(baseColor.h, palette[2]!.h)).toBeCloseTo(180, 5);
    expect(hueDistance(baseColor.h, palette[3]!.h)).toBeCloseTo(90, 5);
  });

  test("produces split complementary colors following expected offsets", () => {
    const palette = harmonyPalette("split-complementary", baseColor, 3, deterministicRandom, 0);

    expect(hueDistance(baseColor.h, palette[1]!.h)).toBeCloseTo(150, 5);
    expect(hueDistance(baseColor.h, palette[2]!.h)).toBeCloseTo(150, 5);
  });

  test("produces analogous colors following thirty degree steps", () => {
    const palette = harmonyPalette("analogous", baseColor, 3, deterministicRandom, 0);

    expect(hueDistance(baseColor.h, palette[1]!.h)).toBeCloseTo(30, 5);
    expect(hueDistance(baseColor.h, palette[2]!.h)).toBeCloseTo(30, 5);
  });

  test("delegates to randomPalette when mode is random", () => {
    const count = 4;
    const palette = harmonyPalette("random", baseColor, count, deterministicRandom, 0);

    expect(palette).toHaveLength(count);
    for (const swatch of palette) {
      expect(swatch.l).toBeGreaterThanOrEqual(0);
      expect(swatch.l).toBeLessThanOrEqual(1);
      expect(swatch.c).toBeGreaterThanOrEqual(0);
    }
  });
});
