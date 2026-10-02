import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import { toComposeTheme, toFlutterTheme, toSwiftUITheme, toTokensStudio } from "@/lib/tokens/native";
import type { DesignTokens } from "@/types/tokens";

const shade = (step: number, hex: string) => ({ step, value: fromHex(hex) });

/** Two palette names that used to collide: "indigo" shade 250 and "indigo-2" shade 50. */
const tokens: DesignTokens = {
  meta: { name: "Acme Labs", prefix: "", generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [
    { name: "indigo", value: fromHex("#0f172a"), shades: [shade(50, "#f3f7fe"), shade(250, "#cdd9f3")] },
    { name: "indigo-2", value: fromHex("#6366f1"), shades: [shade(50, "#f1f6ff")] },
  ],
  semantic: [{ name: "primary", ref: "indigo-2", value: fromHex("#6366f1") }],
  gradient: null,
  typography: null,
  effects: [],
  spacing: [
    { name: "0.5", px: 2 },
    { name: "4", px: 16 },
  ],
  radius: [
    { name: "lg", px: 12 },
    { name: "full", px: 9999 },
  ],
};

const identifiers = (code: string, pattern: RegExp) => [...code.matchAll(pattern)].map((match) => match[1]);

describe("native formats", () => {
  test("Flutter identifiers are unique and valid", () => {
    const code = toFlutterTheme(tokens);
    const ids = identifiers(code, /static const (?:double )?([A-Za-z_][A-Za-z0-9_]*) =/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["indigo_250", "indigo2_50", "s0_5", "s4", "full"]));
    expect(code).toContain("class AcmeLabsColors");
    expect(code).toContain("Color(0xFF6366F1)");
  });

  test("SwiftUI colors are unique and brand-prefixed", () => {
    const code = toSwiftUITheme(tokens);
    const ids = identifiers(code, /static let ([A-Za-z_][A-Za-z0-9_]*)/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["acmeLabsIndigo_250", "acmeLabsIndigo2_50", "acmeLabsPrimary"]));
    expect(code).not.toMatch(/static let indigo\b/);
  });

  test("Compose colors are unique PascalCase members referenced by the color schemes", () => {
    const code = toComposeTheme(tokens);
    const colors = code.slice(code.indexOf("object AcmeLabsColors {"), code.indexOf("object AcmeLabsSpacing"));
    const ids = identifiers(colors, /val ([A-Za-z_][A-Za-z0-9_]*) =/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["Indigo_250", "Indigo2_50", "Primary"]));
    expect(colors).toContain("val Indigo2 = Color(0xFF6366F1)");
    expect(code).toMatch(/val AcmeLabsLightColorScheme = lightColorScheme\(\n {4}primary = AcmeLabsColors\.Primary,/);
    // Dark mode has no 300 or 200 shade of indigo-2 here, so it keeps the primary role.
    expect(code).toMatch(/darkColorScheme\(\n {4}primary = AcmeLabsColors\.Primary,/);
    expect(code).toContain("@Composable\nfun AcmeLabsTheme(");
  });

  test("Compose shapes use the radius tokens and spacing is in dp", () => {
    const code = toComposeTheme(tokens);
    expect(code).toContain("    val Lg = 12.dp\n    val Full = 9999.dp");
    expect(code).toContain("    val S0_5 = 2.dp\n    val S4 = 16.dp");
    expect(code).toContain("val AcmeLabsShapes = Shapes(\n    medium = RoundedCornerShape(AcmeLabsRadius.Lg),\n)");
  });

  test("Compose dark scheme lifts brand colors to a lighter shade and never shadows Color", () => {
    const code = toComposeTheme({
      ...tokens,
      colors: [{ name: "color", value: fromHex("#6366f1"), shades: [shade(300, "#a5b4fc")] }],
      semantic: [{ name: "primary", ref: "color", value: fromHex("#6366f1") }],
      radius: [],
    });
    expect(code).toContain("val Color_ = Color(0xFF6366F1)");
    expect(code).toMatch(/darkColorScheme\(\n {4}primary = AcmeLabsColors\.Color_300,\n {4}onPrimary = Color\.Black,/);
    expect(code).toContain("val AcmeLabsShapes = Shapes()");
  });

  test("Tokens Studio resolves semantic aliases into the palette", () => {
    const json = JSON.parse(toTokensStudio(tokens));
    expect(json.global.color["indigo-2"]["50"]).toEqual({ value: "#f1f6ff", type: "color" });
    expect(json.global.semantic.primary.value).toBe("{color.indigo-2.base}");
    expect(json.global.spacing["0_5"]).toEqual({ value: "2", type: "spacing" });
    expect(json.$metadata.tokenSetOrder).toEqual(["global"]);
  });
});
