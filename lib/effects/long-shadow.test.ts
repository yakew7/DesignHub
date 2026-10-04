import { expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { LONG_SHADOW_MAX_STEPS, longShadow, longShadowSteps } from "@/lib/effects/long-shadow";

const base = { angle: 0, length: 4, color: "#000000", fade: 0 };

test("steps out one pixel at a time along the angle", () => {
  expect(longShadowSteps(base)).toBe(
    "1px 0 0 rgb(0 0 0 / 1), 2px 0 0 rgb(0 0 0 / 1), 3px 0 0 rgb(0 0 0 / 1), 4px 0 0 rgb(0 0 0 / 1)",
  );
  expect(longShadowSteps({ ...base, angle: 90, length: 2 })).toBe("0 1px 0 rgb(0 0 0 / 1), 0 2px 0 rgb(0 0 0 / 1)");
  expect(longShadowSteps({ ...base, angle: 45, length: 1 })).toBe("0.71px 0.71px 0 rgb(0 0 0 / 1)");
});

test("fades toward the far end", () => {
  expect(longShadowSteps({ ...base, fade: 1 })).toBe(
    "1px 0 0 rgb(0 0 0 / 1), 2px 0 0 rgb(0 0 0 / 0.75), 3px 0 0 rgb(0 0 0 / 0.5), 4px 0 0 rgb(0 0 0 / 0.25)",
  );
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
  const effect = longShadow.generate({ ...effectDefaults["long-shadow"], ...base, length: 1 });
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
