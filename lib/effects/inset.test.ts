import { expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { inset, insetPresets } from "@/lib/effects/inset";

const shadow = "inset 0 2px 6px 0 rgb(0 0 0 / 0.18)";

test("generates one inset box shadow on the fill", () => {
  const { declarations } = inset.generate(effectDefaults.inset);
  expect(declarations).toEqual([
    { property: "background-color", value: "#f4f4f5" },
    { property: "border-radius", value: "12px" },
    { property: "box-shadow", value: shadow },
  ]);
});

test("exports in every Effects Lab format", () => {
  const effect = inset.generate(effectDefaults.inset);
  expect(effectStylesheet(effect, ".inset")).toContain(`box-shadow: ${shadow};`);
  expect(tailwindClasses(effect.declarations)).toContain("[box-shadow:inset_0_2px_6px_0_rgb(0_0_0_/_0.18)]");
  expect(tailwindUtility("fx-inset", effect)).toContain("@utility fx-inset {");
  expect(scssMixin("fx-inset", effect)).toContain("@mixin fx-inset {");
  expect(reactStyle("inset", effect)).toContain(`boxShadow: "${shadow}",`);
});

test("is part of the effects.css bundle", () => {
  expect(effectsBundle(effectDefaults)).toContain(`/* Inner shadow */\n.fx-inset {`);
});

test("has three presets that differ", () => {
  expect(insetPresets).toHaveLength(3);
  const values = insetPresets.map((preset) => inset.generate({ ...effectDefaults.inset, ...preset.shadow }));
  expect(new Set(values.map((value) => value.declarations[2]!.value)).size).toBe(3);
});
