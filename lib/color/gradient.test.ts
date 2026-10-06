import { describe, expect, test } from "vitest";

import { oklch, toHex } from "@/lib/color/color";
import {
  colorAt,
  createStop,
  gradientCss,
  gradientCssFallback,
  gradientFromColors,
  sortedStops,
} from "@/lib/color/gradient";
import type { Gradient } from "@/types/color";

const red = oklch(0.628, 0.2577, 29.23);
const blue = oklch(0.452, 0.313, 264.05);

function gradient(overrides: Partial<Gradient> = {}): Gradient {
  return {
    type: "linear",
    angle: 90,
    x: 30,
    y: 70,
    interpolation: "oklch",
    stops: [createStop(red, 0), createStop(blue, 100)],
    ...overrides,
  };
}

describe("sortedStops", () => {
  test("orders stops by position without mutating the gradient", () => {
    const input = gradient({ stops: [createStop(blue, 80), createStop(red, 10), createStop(blue, 45)] });
    expect(sortedStops(input).map((stop) => stop.position)).toEqual([10, 45, 80]);
    expect(input.stops.map((stop) => stop.position)).toEqual([80, 10, 45]);
  });
});

describe("gradientCss", () => {
  test("linear puts the interpolation space before the rounded angle", () => {
    const css = gradientCss(gradient({ angle: 134.6 }));
    expect(css).toMatch(/^linear-gradient\(in oklch 135deg, oklch\([^)]+\) 0%, oklch\([^)]+\) 100%\)$/);
  });

  test("radial uses a circle at the center point", () => {
    const css = gradientCss(gradient({ type: "radial", interpolation: "oklab" }));
    expect(css.startsWith("radial-gradient(circle at 30% 70% in oklab, ")).toBe(true);
  });

  test("conic starts from the angle at the center point", () => {
    const css = gradientCss(gradient({ type: "conic", angle: 45 }));
    expect(css.startsWith("conic-gradient(from 45deg at 30% 70% in oklch, ")).toBe(true);
  });

  test("srgb interpolation omits the color space", () => {
    expect(gradientCss(gradient({ interpolation: "srgb" })).startsWith("linear-gradient(90deg, oklch(")).toBe(true);
    expect(gradientCss(gradient({ type: "radial", interpolation: "srgb" }))).toMatch(
      /^radial-gradient\(circle at 30% 70%, oklch\(/,
    );
  });

  test("lists stops in position order and rounds positions", () => {
    const css = gradientCss(gradient({ stops: [createStop(blue, 99.6), createStop(red, 0.4)] }));
    const positions = [...css.matchAll(/\) (\d+)%/g)].map((match) => Number(match[1]));
    expect(positions).toEqual([0, 100]);
    expect(css.indexOf("29.23")).toBeLessThan(css.indexOf("264.05"));
  });
});

describe("gradientCssFallback", () => {
  test("uses sorted sRGB hex stops and no interpolation space", () => {
    const input = gradient({ stops: [createStop(blue, 100), createStop(red, 0)] });
    expect(gradientCssFallback(input)).toBe(`linear-gradient(90deg, ${toHex(red)} 0%, ${toHex(blue)} 100%)`);
  });

  test.each([
    ["radial", "radial-gradient(circle at 30% 70%, #"],
    ["conic", "conic-gradient(from 90deg at 30% 70%, #"],
  ] as const)("%s fallback keeps its geometry", (type, start) => {
    const css = gradientCssFallback(gradient({ type }));
    expect(css.startsWith(start)).toBe(true);
    expect(css).not.toContain(" in ");
    expect(css).not.toContain("oklch(");
  });

  test("keeps stop transparency as an 8-digit hex", () => {
    const css = gradientCssFallback(gradient({ stops: [createStop(oklch(0.5, 0.1, 200, 0.5), 0)] }));
    expect(css).toMatch(/#[0-9a-f]{8} 0%/);
  });
});

describe("gradientFromColors", () => {
  test("spreads stops evenly and caps them at six", () => {
    const colors = Array.from({ length: 8 }, (_, index) => oklch(0.5, 0.1, index * 40));
    expect(gradientFromColors(colors, gradient()).stops.map((stop) => stop.position)).toEqual([0, 20, 40, 60, 80, 100]);
  });
});

describe("colorAt", () => {
  test("clamps outside the stops and interpolates between them", () => {
    const input = gradient({ stops: [createStop(oklch(0.2, 0.1, 10), 20), createStop(oklch(0.8, 0.2, 50), 80)] });
    expect(colorAt(input, 0).l).toBeCloseTo(0.2);
    expect(colorAt(input, 100).l).toBeCloseTo(0.8);
    const middle = colorAt(input, 50);
    expect(middle.l).toBeCloseTo(0.5);
    expect(middle.h).toBeCloseTo(30);
  });

  test("takes the short way around the hue circle", () => {
    const input = gradient({ stops: [createStop(oklch(0.5, 0.1, 350), 0), createStop(oklch(0.5, 0.1, 30), 100)] });
    expect(colorAt(input, 50).h).toBeCloseTo(10);
  });
});
