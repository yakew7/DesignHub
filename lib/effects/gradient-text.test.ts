import { describe, expect, test } from "vitest";

import { oklch } from "@/lib/color/color";
import { createStop, defaultGradient } from "@/lib/color/gradient";
import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, tailwindClasses } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import type { Gradient } from "@/types/color";
import type { EffectCss, GradientTextSettings } from "@/types/effects";

const defaults = effectDefaults["gradient-text"];

const studio: Gradient = {
  ...defaultGradient,
  angle: 45,
  interpolation: "srgb",
  stops: [createStop(oklch(0.628, 0.2577, 29.23), 0), createStop(oklch(0.452, 0.313, 264.05), 100)],
};

function generate(patch: Partial<GradientTextSettings> = {}, gradient: Gradient = studio): EffectCss {
  return generateEffect("gradient-text", { ...defaults, ...patch }, { gradient })!;
}

const value = (effect: EffectCss, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

describe("gradient text", () => {
  test("uses the Color Studio gradient by default", () => {
    const effect = generate();
    expect(value(effect, "background-image")).toBe("linear-gradient(45deg, #ff0000 0%, #0000ff 100%)");
  });

  test("clips the gradient to the text and keeps a solid color fallback", () => {
    const effect = generate();
    // color comes first so it applies wherever the gradient fill doesn't.
    expect(effect.declarations[0]).toEqual({ property: "color", value: "#ff0000" });
    expect(value(effect, "background-clip")).toBe("text");
    expect(value(effect, "-webkit-background-clip")).toBe("text");
    expect(value(effect, "-webkit-text-fill-color")).toBe("transparent");
    // The text itself is never hidden with color: transparent, so it stays readable and selectable.
    expect(effect.declarations.filter((declaration) => declaration.property === "color")).toHaveLength(1);
    expect(generate({ fallback: "#123456" }).declarations[0]).toEqual({ property: "color", value: "#123456" });
  });

  test("upgrades to the studio's OKLCH interpolation where supported", () => {
    const effect = generate({}, { ...studio, interpolation: "oklch" });
    expect(value(effect, "background-image")).toBe("linear-gradient(45deg, #ff0000 0%, #0000ff 100%)");
    const css = effectStylesheet(effect, ".title");
    expect(css).toContain("@supports (background-image: linear-gradient(in oklch, red, blue)) {\n  .title {\n");
    expect(css).toMatch(/background-image: linear-gradient\(in oklch 45deg, oklch\([^)]*\) 0%, oklch\([^)]*\) 100%\);/);
    expect(effectStylesheet(generate(), ".title")).not.toContain("@supports");
  });

  test("custom stops ignore the studio gradient", () => {
    const effect = generate({ source: "custom", colors: ["#111111", "#eeeeee"], angle: 180 });
    expect(value(effect, "background-image")).toBe("linear-gradient(180deg, #111111, #eeeeee)");
    expect(value(effect, "color")).toBe("#111111");
  });

  test("the animated shift has keyframes and stops for reduced motion", () => {
    expect(value(generate(), "animation")).toBeUndefined();
    const effect = generate({ animated: true, speed: 8 });
    expect(value(effect, "background-size")).toBe("200% 100%");
    expect(value(effect, "animation")).toBe("gradient-text-shift 8s ease-in-out infinite alternate");
    expect(effect.global).toContain("@keyframes gradient-text-shift {");
    const css = effectStylesheet(effect, ".title");
    expect(css).toContain("@media (prefers-reduced-motion: reduce) {\n  .title {\n    animation: none;\n  }\n}");
    expect(effect.tailwindNote).toBeTruthy();
  });

  test("high contrast themes draw the text in the forced color", () => {
    expect(effectStylesheet(generate(), ".title")).toContain(
      "@media (forced-colors: active) {\n  .title {\n    -webkit-text-fill-color: currentColor;\n    background: none;\n  }\n}",
    );
  });

  test("Tailwind keeps -webkit-text-fill-color but leaves prefixing background-clip to Tailwind", () => {
    const classes = tailwindClasses(generate().declarations);
    expect(classes).toContain("[-webkit-text-fill-color:transparent]");
    expect(classes).toContain("[background-clip:text]");
    expect(classes).not.toContain("[-webkit-background-clip:text]");
  });

  test("React style uses the Webkit-prefixed keys", () => {
    const react = reactStyle("gradient-text", generate());
    expect(react).toContain('WebkitTextFillColor: "transparent",');
    expect(react).toContain('WebkitBackgroundClip: "text",');
  });

  test("effects.css follows the studio gradient it is given", () => {
    const bundle = effectsBundle(effectDefaults, { gradient: studio });
    expect(bundle).toContain(
      "/* Gradient text */\n.fx-gradient-text {\n  color: #ff0000;\n  background-image: linear-gradient(45deg, #ff0000 0%, #0000ff 100%);",
    );
  });
});
