import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import {
  tokenFormats,
  toJsModule,
  toSassMap,
  toScss,
  toStyledTheme,
  toStylus,
  toYaml,
  yamlString,
} from "@/lib/tokens/formats";
import type { DesignTokens } from "@/types/tokens";

const tokens = (prefix = ""): DesignTokens => ({
  meta: { name: "Acme Labs", prefix, generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [
    { name: "indigo", value: fromHex("#6366f1"), shades: [{ step: 250, value: fromHex("#cdd9f3") }] },
    { name: "indigo-2", value: fromHex("#0f172a"), shades: [{ step: 50, value: fromHex("#f1f6ff") }] },
  ],
  semantic: [{ name: "primary", ref: "indigo", value: fromHex("#6366f1") }],
  gradient: null,
  typography: null,
  effects: [{ name: "shadow-md", value: "0 1px 2px rgb(0 0 0 / 0.1)" }],
  spacing: [
    { name: "0.5", px: 2 },
    { name: "4", px: 16 },
  ],
  radius: [{ name: "lg", px: 12 }],
});

/** Evaluates the generated ES module the way Node would import tokens.mjs. */
async function importModule(code: string) {
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  return (await import(/* @vite-ignore */ url)) as { tokens: Record<string, Record<string, string>>; default: unknown };
}

describe("JavaScript module", () => {
  test("exports a frozen object with colors and spacing", async () => {
    const mod = await importModule(toJsModule(tokens()));
    expect(mod.default).toBe(mod.tokens);
    expect(Object.isFrozen(mod.tokens)).toBe(true);
    expect(Object.isFrozen(mod.tokens.color)).toBe(true);
    expect(mod.tokens.color!.primary).toBe("#6366f1");
    // "indigo" shade 250 and "indigo-2" shade 50 stay separate keys.
    expect(mod.tokens.color!["indigo-250"]).toBe("#cdd9f3");
    expect(mod.tokens.color!["indigo-2-50"]).toBe("#f1f6ff");
    expect(mod.tokens.spacing!["0.5"]).toBe("0.125rem");
  });

  test("prepends the prefix to every key", async () => {
    const mod = await importModule(toJsModule(tokens("acme")));
    expect(mod.tokens.color!["acme-indigo"]).toBe("#6366f1");
    expect(mod.tokens.spacing!["acme-4"]).toBe("1rem");
    expect(Object.keys(mod.tokens.radius!)).toEqual(["acme-lg"]);
  });
});

describe("Stylus", () => {
  test("uses the SCSS variable names with Stylus assignments", () => {
    const stylus = toStylus(tokens("acme"));
    const scssNames = [...toScss(tokens("acme")).matchAll(/^(\$[\w-]+):/gm)].map((match) => match[1]);
    const stylusNames = [...stylus.matchAll(/^(\$[\w-]+) = /gm)].map((match) => match[1]);
    expect(stylusNames.slice(0, scssNames.length)).toEqual(scssNames);
    expect(stylus).toContain("$acme-color-indigo = #6366f1\n");
    expect(stylus).toContain("$acme-spacing-0_5 = 0.125rem\n");
    expect(stylus).toContain('$spacing = {\n  "0.5": $acme-spacing-0_5\n  "4": $acme-spacing-4\n}');
  });

  test("passes functions through unquote() so Stylus doesn't evaluate them", () => {
    expect(toStylus(tokens())).toContain('$shadow-md = unquote("0 1px 2px rgb(0 0 0 / 0.1)")');
  });
});

test("the new formats are registered for the Export Engine and the ZIP", () => {
  const formats = tokenFormats(tokens());
  expect(formats.map((format) => format.filename)).toEqual(
    expect.arrayContaining(["tokens.mjs", "tokens.styl", "Theme.kt", "tokens.yaml", "_tokens-map.scss"]),
  );
});

describe("styled-components theme", () => {
  test("keeps shades of similarly named colors apart", () => {
    const theme = toStyledTheme(tokens());
    expect(theme).toContain('indigo250: "#cdd9f3"');
    expect(theme).toContain('indigo2_50: "#f1f6ff"');
  });
});

describe("YAML", () => {
  test("writes colors, spacing and the prefix with # values quoted", () => {
    const yaml = toYaml(tokens("acme"));
    expect(yaml).toMatch(/^# Acme Labs - design tokens/);
    expect(yaml).toContain('color:\n  acme-indigo: "#6366f1"\n');
    expect(yaml).toContain('  acme-indigo-2-50: "#f1f6ff"\n');
    expect(yaml).toContain('semantic:\n  acme-primary: "#6366f1"\n');
    expect(yaml).toContain("spacing:\n  acme-0.5: 0.125rem\n  acme-4: 1rem\n");
    expect(yaml).toContain('  acme-shadow-md: "0 1px 2px rgb(0 0 0 / 0.1)"\n');
  });

  test("quotes keys and values YAML would read as numbers, booleans or comments", () => {
    const yaml = toYaml(tokens());
    expect(yaml).toContain('spacing:\n  "0.5": 0.125rem\n  "4": 1rem\n');
    expect(["yes", "No", "null", "~", "0", "1e3", "0x1f", ".inf", "#fff", "a: b"].map(yamlString)).toEqual([
      '"yes"',
      '"No"',
      '"null"',
      '"~"',
      '"0"',
      '"1e3"',
      '"0x1f"',
      '".inf"',
      '"#fff"',
      '"a: b"',
    ]);
    expect(yamlString("0.125rem")).toBe("0.125rem");
  });
});

describe("Sass map", () => {
  test("nests every group in $tokens and adds a token() lookup", () => {
    const sass = toSassMap(tokens("acme"));
    expect(sass).toContain('@use "sass:map";');
    expect(sass).toContain('$tokens: (\n  "color": (\n    "indigo": #6366f1,\n    "indigo-250": #cdd9f3,');
    expect(sass).toContain('  "spacing": (\n    "0.5": 0.125rem,\n    "4": 1rem,\n  ),');
    expect(sass).toContain('"shadow-md": 0 1px 2px rgb(0 0 0 / 0.1),');
    expect(sass).toContain("@function token($group, $name) {");
    expect(sass).toContain("@return map.get($tokens, $group, $name);");
  });

  test("wraps values with commas so they stay one map entry", () => {
    const layered = { ...tokens(), effects: [{ name: "shadow-lg", value: "0 1px 2px #000, 0 4px 8px #000" }] };
    expect(toSassMap(layered)).toContain('"shadow-lg": (0 1px 2px #000, 0 4px 8px #000),');
  });
});
