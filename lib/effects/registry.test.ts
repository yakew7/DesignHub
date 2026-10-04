import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { effectDefinitions, generateEffect } from "@/lib/effects/registry";

/** Every registered effect, so new effects are covered without touching this file. */
const cases = effectDefinitions.map((definition) => [definition.kind, definition] as const);

describe.each(cases)("%s", (kind, definition) => {
  const effect = generateEffect(kind, effectDefaults[kind]);

  test("generates from its default settings", () => {
    expect(effect).not.toBeNull();
    expect(effect!.declarations.length).toBeGreaterThan(0);
    for (const { property, value } of effect!.declarations) {
      expect(property).toMatch(/^-?[a-z][a-z-]*$/);
      expect(value.trim()).not.toBe("");
    }
  });

  test("every export format is non-empty with no undefined or NaN", () => {
    const formats = {
      css: effectStylesheet(effect!, `.fx-${kind}`),
      tailwind: tailwindClasses(effect!.declarations),
      tailwindUtility: tailwindUtility(`fx-${kind}`, effect!),
      scss: scssMixin(`fx-${kind}`, effect!),
      react: reactStyle(kind, effect!),
    };
    for (const [format, code] of Object.entries(formats)) {
      expect(code.trim(), format).not.toBe("");
      expect(code, format).not.toMatch(/undefined|NaN|\bnull\b|\[object Object\]/);
    }
  });

  test("has a rule in the effects.css bundle", () => {
    expect(effectsBundle(effectDefaults)).toContain(`/* ${definition.label} */\n.fx-${kind} {`);
  });
});

test("effect kinds are unique", () => {
  const kinds = effectDefinitions.map((definition) => definition.kind);
  expect(new Set(kinds).size).toBe(kinds.length);
});

test("the bundle has no undefined or NaN", () => {
  expect(effectsBundle(effectDefaults)).not.toMatch(/undefined|NaN/);
});
