import { describe, expect, test } from "vitest";

import { parseTokensFile, summarizeImport } from "@/lib/brand/import-tokens";
import { fromHex, toHex } from "@/lib/color/color";
import { defaultGradient } from "@/lib/color/gradient";
import { defaultShadeOptions } from "@/lib/color/shades";
import { buildTokens } from "@/lib/tokens/build";
import { toJsonTokens } from "@/lib/tokens/formats";
import { defaultTokenSettings } from "@/store/tokens-store";
import { defaultRhythm, defaultScale } from "@/store/typography-store";
import type { TokenSettings } from "@/types/tokens";
import type { FontFamily } from "@/types/typography";

const font = (family: string, category: FontFamily["category"]): FontFamily => ({
  family,
  category,
  weights: [400, 700],
  italic: false,
  rank: 1,
});

const palette = ["#0f172a", "#e11d48", "#14b8a6", "#facc15", "#f5f5f4"];

/** DesignHub's own tokens.json for a known brand. */
function exported(settings: Partial<TokenSettings> = {}): string {
  const tokens = buildTokens(
    {
      colors: palette.map(fromHex),
      shadeOptions: defaultShadeOptions,
      gradient: defaultGradient,
      heading: font("Playfair Display", "serif"),
      body: font("Source Sans 3", "sans-serif"),
      scale: defaultScale,
      rhythm: { ...defaultRhythm, headingWeight: 700, bodyWeight: 300 },
      effects: [{ name: "shadow-md", value: "0 1px 2px #0003" }],
    },
    { ...defaultTokenSettings, radiusBase: 20, spacingBase: 6, ...settings },
  );
  return toJsonTokens(tokens);
}

describe("importing a DTCG tokens file", () => {
  test("DesignHub's own export round-trips to the same brand", () => {
    const imported = parseTokensFile(exported());
    expect(imported.colors?.map((color) => toHex(color))).toEqual(palette);
    expect(imported.gradient?.map((stop) => toHex(stop.color))).toEqual(
      defaultGradient.stops.map((stop) => toHex(stop.color)),
    );
    expect(imported.gradient?.map((stop) => stop.position)).toEqual(defaultGradient.stops.map((stop) => stop.position));
    expect(imported.headingFont).toBe("Playfair Display");
    expect(imported.bodyFont).toBe("Source Sans 3");
    expect(imported.headingWeight).toBe(700);
    expect(imported.bodyWeight).toBe(300);
    expect(imported.radiusBase).toBe(20);
    expect(imported.spacingBase).toBe(6);
    // Semantic aliases and type sizes are derived, so they are counted as ignored, not applied.
    expect(imported.ignored).toBeGreaterThan(0);
    expect(imported.notes).toEqual([]);
  });

  test("an export without shades still reads every color", () => {
    const imported = parseTokensFile(
      exported({ sections: { ...defaultTokenSettings.sections, shades: false, typography: false } }),
    );
    expect(imported.colors?.map((color) => toHex(color))).toEqual(palette);
    expect(imported.headingFont).toBeNull();
  });

  test("hex strings and px strings from other tools are accepted", () => {
    const imported = parseTokensFile(
      JSON.stringify({
        color: { $type: "color", ink: { $value: "#111111" }, paper: { $value: "#fafafa" } },
        radius: { md: { $type: "dimension", $value: "8px" } },
        unknown: { thing: { $value: 1 } },
      }),
    );
    expect(imported.colors?.map((color) => toHex(color))).toEqual(["#111111", "#fafafa"]);
    expect(imported.radiusBase).toBe(12);
    expect(imported.ignored).toBe(1);
    expect(summarizeImport(imported)).toEqual(["2 colors", "Radius 12px", "1 other tokens ignored"]);
  });

  test("fonts DesignHub can't load are skipped with a note", () => {
    const imported = parseTokensFile(exported(), { isKnownFont: (family) => family !== "Playfair Display" });
    expect(imported.headingFont).toBeNull();
    expect(imported.bodyFont).toBe("Source Sans 3");
    expect(imported.notes[0]).toContain("Playfair Display");
  });
});

describe("invalid files throw a readable error", () => {
  test.each([
    ["not json", "{ nope", "valid JSON"],
    ["an array", "[1, 2]", "tokens file"],
    ["no known tokens", JSON.stringify({ size: { base: { $value: "16px" } } }), "No colors"],
    ["a project file", JSON.stringify({ format: "designhub.project" }), "project file"],
    ["a broken color", JSON.stringify({ color: { a: { $type: "color", $value: "not-a-color" } } }), '"a"'],
    ["a broken radius", JSON.stringify({ radius: { lg: { $type: "dimension", $value: "big" } } }), "radius"],
  ])("%s", (_, text, message) => {
    expect(() => parseTokensFile(text)).toThrow(message);
  });
});
