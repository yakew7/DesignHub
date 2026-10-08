import { describe, expect, test } from "vitest";

import { DISTINGUISHABLE_THRESHOLD, paletteVisionSection } from "@/lib/a11y/vision";
import { fromHex } from "@/lib/color/color";
import { simulatedDistance } from "@/lib/color/vision";

const red = { name: "Red", hex: "#e53935" };
const green = { name: "Green", hex: "#43a047" };
const blue = { name: "Blue", hex: "#1e88e5" };
const orange = { name: "Orange", hex: "#fb8c00" };

const mode = (section: ReturnType<typeof paletteVisionSection>, name: string) =>
  section.modes.find((entry) => entry.mode === name);

describe("paletteVisionSection", () => {
  test("flags a red and green pair under deuteranopia", () => {
    const section = paletteVisionSection([red, green]);
    const deuteranopia = mode(section, "deuteranopia");
    expect(deuteranopia?.pass).toBe(false);
    expect(section.pass).toBe(false);
    const [pair] = deuteranopia?.pairs ?? [];
    expect(pair.a.name).toBe("Red");
    expect(pair.b.name).toBe("Green");
    expect(pair.distance).toBeLessThan(DISTINGUISHABLE_THRESHOLD);
    expect(pair.typicalDistance).toBeGreaterThan(DISTINGUISHABLE_THRESHOLD);
  });

  test("suggests a lightness change that separates the pair", () => {
    const pair = mode(paletteVisionSection([red, green]), "deuteranopia")?.pairs[0];
    const suggestion = pair?.suggestion;
    expect(suggestion).not.toBeNull();
    if (!suggestion) return;
    const changed = fromHex(suggestion.to);
    const other = fromHex(suggestion.color === "Red" ? green.hex : red.hex);
    expect(fromHex(suggestion.from).h).toBeCloseTo(changed.h, 0);
    expect(simulatedDistance(changed, other, "deuteranopia")).toBeGreaterThanOrEqual(DISTINGUISHABLE_THRESHOLD);
  });

  test("passes a blue and orange pair under every vision type", () => {
    const section = paletteVisionSection([blue, orange]);
    expect(section.pass).toBe(true);
    expect(section.modes.map((entry) => entry.mode)).toEqual(["protanopia", "deuteranopia", "tritanopia", "grayscale"]);
    for (const entry of section.modes) expect(entry.pairs).toEqual([]);
  });

  test("ignores tints that already look alike and skips invalid colors", () => {
    const section = paletteVisionSection([red, { name: "Red 2", hex: "#e53936" }, { name: "Bad", hex: "nope" }]);
    expect(section.colors.map((color) => color.name)).toEqual(["Red", "Red 2"]);
    expect(section.pass).toBe(true);
  });
});
