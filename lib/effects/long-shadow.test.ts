import { expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import {
  compensatedAlphas,
  compositedOpacity,
  LONG_SHADOW_MAX_STEPS,
  longShadow,
  longShadowRamp,
  longShadowSteps,
} from "@/lib/effects/long-shadow";

const base = { angle: 0, length: 4, color: "#000000", fade: 0, target: "text" } as const;

test("steps out one pixel at a time along the angle", () => {
  expect(longShadowSteps(base)).toBe(
    "1px 0 0 rgb(0 0 0 / 1), 2px 0 0 rgb(0 0 0 / 1), 3px 0 0 rgb(0 0 0 / 1), 4px 0 0 rgb(0 0 0 / 1)",
  );
  expect(longShadowSteps({ ...base, angle: 90, length: 2 })).toBe("0 1px 0 rgb(0 0 0 / 1), 0 2px 0 rgb(0 0 0 / 1)");
  expect(longShadowSteps({ ...base, angle: 45, length: 1 })).toBe("0.71px 0.71px 0 rgb(0 0 0 / 1)");
});

test("fades text toward the far end in a straight ramp", () => {
  expect(longShadowSteps({ ...base, fade: 1 })).toBe(
    "1px 0 0 rgb(0 0 0 / 1), 2px 0 0 rgb(0 0 0 / 0.75), 3px 0 0 rgb(0 0 0 / 0.5), 4px 0 0 rgb(0 0 0 / 0.25)",
  );
});

test("fades a box evenly by compensating each copy for the copies it overlaps", () => {
  // The band next to the box is covered by all four copies, the band at the tip by the last one.
  expect(longShadowSteps({ ...base, fade: 1, target: "box" })).toBe(
    "1px 0 0 rgb(0 0 0 / 1), 2px 0 0 rgb(0 0 0 / 0.5), 3px 0 0 rgb(0 0 0 / 0.333), 4px 0 0 rgb(0 0 0 / 0.25)",
  );
  // Without fade the copies stay solid, as on text.
  expect(longShadowSteps({ ...base, target: "box" })).toBe(longShadowSteps(base));
});

test("the ramp runs linearly from solid to one step short of the fade", () => {
  expect(longShadowRamp(4, 1)).toEqual([1, 0.75, 0.5, 0.25]);
  expect(longShadowRamp(5, 0.5)).toEqual([1, 0.9, 0.8, 0.7, 0.6]);
  expect(longShadowRamp(3, 0)).toEqual([1, 1, 1]);
});

test.each([
  [20, 1],
  [60, 1],
  [120, 0.6],
  [120, 0.2],
])("compensated box alphas composite back to the linear ramp (length %i, fade %f)", (length, fade) => {
  const steps = Math.min(LONG_SHADOW_MAX_STEPS, length);
  const ramp = longShadowRamp(steps, fade);
  const alphas = compensatedAlphas(ramp);
  for (const alpha of alphas) {
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThanOrEqual(1);
  }
  compositedOpacity(alphas).forEach((opacity, index) => expect(opacity).toBeCloseTo(ramp[index]!, 10));
  // Even after the CSS rounds each alpha to three decimals, the result stays within half a percent.
  const rounded = longShadowSteps({ angle: 0, length, color: "#000000", fade, target: "box" })
    .split(", ")
    .map((step) => Number(/\/ ([\d.]+)\)$/.exec(step)?.[1]));
  compositedOpacity(rounded).forEach((opacity, index) => expect(Math.abs(opacity - ramp[index]!)).toBeLessThan(0.005));
});

test("uncompensated copies pile up on a box, which is the bug the compensation fixes", () => {
  const ramp = longShadowRamp(60, 1);
  // Half way along, stacking the ramp itself is already almost solid instead of half transparent.
  expect(compositedOpacity(ramp)[30]).toBeGreaterThan(0.99);
  expect(compositedOpacity(compensatedAlphas(ramp))[30]).toBeCloseTo(0.5, 10);
});

test(`never uses more than ${LONG_SHADOW_MAX_STEPS} steps, and still reaches the full length`, () => {
  const steps = longShadowSteps({ ...base, length: 120 }).split(", ");
  expect(steps).toHaveLength(LONG_SHADOW_MAX_STEPS);
  expect(steps[0]).toBe("2px 0 0 rgb(0 0 0 / 1)");
  expect(steps.at(-1)).toBe("120px 0 0 rgb(0 0 0 / 1)");
});

test("targets a box with box-shadow or text with text-shadow", () => {
  const box = longShadow.generate({ ...effectDefaults["long-shadow"], ...base, target: "box" });
  expect(box.declarations).toEqual([
    { property: "background-color", value: "#6366f1" },
    { property: "border-radius", value: "12px" },
    { property: "box-shadow", value: longShadowSteps(base) },
  ]);
  const text = longShadow.generate({ ...effectDefaults["long-shadow"], ...base, target: "text" });
  expect(text.declarations).toEqual([{ property: "text-shadow", value: longShadowSteps(base) }]);
});

test("exports in every Effects Lab format", () => {
  const effect = longShadow.generate({ ...effectDefaults["long-shadow"], ...base, length: 1, target: "box" });
  const shadow = "1px 0 0 rgb(0 0 0 / 1)";
  expect(effectStylesheet(effect, ".long-shadow")).toContain(`box-shadow: ${shadow};`);
  expect(tailwindClasses(effect.declarations)).toContain("[box-shadow:1px_0_0_rgb(0_0_0_/_1)]");
  expect(tailwindUtility("fx-long-shadow", effect)).toContain("@utility fx-long-shadow {");
  expect(scssMixin("fx-long-shadow", effect)).toContain("@mixin fx-long-shadow {");
  // The kind has a hyphen, so the React export needs a camelCase name to be valid TypeScript.
  const react = reactStyle("long-shadow", effect);
  expect(react).toContain("export const longShadowStyle: CSSProperties = {");
  expect(react).toContain(`boxShadow: "${shadow}",`);
});

test("is part of the effects.css bundle", () => {
  expect(effectsBundle(effectDefaults)).toContain(`/* Long shadow */\n.fx-long-shadow {`);
});
