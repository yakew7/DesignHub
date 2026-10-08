import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import {
  tokenFormats,
  toBootstrapVariables,
  toChakraTheme,
  toJsModule,
  toPandaPreset,
  toSassMap,
  toScss,
  toStyledTheme,
  toStylus,
  toUnoConfig,
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
    expect.arrayContaining([
      "tokens.mjs",
      "tokens.styl",
      "Theme.kt",
      "tokens.yaml",
      "_tokens-map.scss",
      "uno.config.ts",
      "panda.preset.ts",
      "_bootstrap-variables.scss",
    ]),
  );
  expect(formats.map((format) => format.id)).toEqual(expect.arrayContaining(["chakra", "bootstrap"]));
  // Chakra shares theme.ts with React and Vue, which the ZIP puts in a folder per format.
  expect(formats.find((format) => format.id === "chakra")?.filename).toBe("theme.ts");
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

describe("UnoCSS", () => {
  test("nests shades under each color and prepends the prefix to theme keys", () => {
    const uno = toUnoConfig(tokens("acme"));
    expect(uno).toContain('import { defineConfig, presetWind3, type PresetWind3Theme } from "unocss";');
    expect(uno).toContain("presets: [presetWind3()],");
    expect(uno).toContain('"acme-indigo": { 250: "#cdd9f3", DEFAULT: "#6366f1" },');
    expect(uno).toContain('"acme-indigo-2": { 50: "#f1f6ff", DEFAULT: "#0f172a" },');
    expect(uno).toContain('"acme-primary": "#6366f1",');
    expect(uno).toContain('spacing: { "acme-0.5": "0.125rem", "acme-4": "1rem" },');
    expect(uno).toContain('borderRadius: { "acme-lg": "0.75rem" },');
    expect(uno).toContain('boxShadow: { "acme-md": "0 1px 2px rgb(0 0 0 / 0.1)" },');
  });

  test("leaves keys bare without a prefix", () => {
    expect(toUnoConfig(tokens())).toContain('indigo: { 250: "#cdd9f3", DEFAULT: "#6366f1" },');
  });
});

const withRoles: DesignTokens = {
  ...tokens(),
  colors: [
    {
      name: "indigo",
      value: fromHex("#6366f1"),
      shades: [
        { step: 200, value: fromHex("#c7d2fe") },
        { step: 300, value: fromHex("#a5b4fc") },
      ],
    },
    { name: "slate", value: fromHex("#0f172a"), shades: [] },
  ],
  semantic: [
    { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
    { name: "foreground", ref: "slate", value: fromHex("#0f172a") },
    { name: "background", ref: "white", value: fromHex("#ffffff") },
  ],
};

describe("Panda CSS", () => {
  test("writes base tokens for every scale", () => {
    const panda = toPandaPreset(withRoles);
    expect(panda).toContain('import { definePreset } from "@pandacss/dev";');
    expect(panda).toContain('name: "acme-labs",');
    expect(panda).toContain('200: { value: "#c7d2fe" },');
    expect(panda).toContain('DEFAULT: { value: "#6366f1" },');
    expect(panda).toContain('slate: { value: "#0f172a" },');
    expect(panda).toContain('spacing: { 4: { value: "1rem" }, "0.5": { value: "0.125rem" } },');
    expect(panda).toContain('radii: { lg: { value: "0.75rem" } },');
    expect(panda).toContain('shadows: { md: { value: "0 1px 2px rgb(0 0 0 / 0.1)" } },');
  });

  test("semantic tokens reference the base tokens, with lifted and swapped _dark values", () => {
    const panda = toPandaPreset(withRoles);
    expect(panda).toContain('primary: { value: { base: "{colors.indigo}", _dark: "{colors.indigo.300}" } },');
    // Dark mode swaps background and foreground; white has no base token, so it keeps its value.
    expect(panda).toContain('foreground: { value: { base: "{colors.slate}", _dark: "#ffffff" } },');
    expect(panda).toContain('background: { value: { base: "#ffffff", _dark: "{colors.slate}" } },');
  });

  test("prefixes token keys and the references to them", () => {
    const panda = toPandaPreset({ ...withRoles, meta: { ...withRoles.meta, prefix: "acme" } });
    expect(panda).toContain('"acme-slate": { value: "#0f172a" },');
    expect(panda).toContain('_dark: "{colors.acme-indigo.300}"');
  });
});

describe("Chakra UI", () => {
  test("builds a system from defineConfig with base tokens", () => {
    const chakra = toChakraTheme(withRoles);
    expect(chakra).toContain('import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";');
    expect(chakra).toContain("export const system = createSystem(defaultConfig, config);");
    expect(chakra).toContain('300: { value: "#a5b4fc" },');
    expect(chakra).toContain('DEFAULT: { value: "#6366f1" },');
    expect(chakra).toContain('spacing: { 4: { value: "1rem" }, "0.5": { value: "0.125rem" } },');
    expect(chakra).toContain('radii: { lg: { value: "0.75rem" } },');
    expect(chakra).toContain('shadows: { md: { value: "0 1px 2px rgb(0 0 0 / 0.1)" } },');
  });

  test("semantic colors reference base tokens with _dark values", () => {
    const chakra = toChakraTheme({ ...withRoles, meta: { ...withRoles.meta, prefix: "acme" } });
    expect(chakra).toContain('"acme-primary": {');
    expect(chakra).toContain('value: { base: "{colors.acme-indigo}", _dark: "{colors.acme-indigo.300}" },');
    expect(chakra).toContain('"acme-background": { value: { base: "#ffffff", _dark: "{colors.acme-slate}" } },');
  });
});

describe("Bootstrap", () => {
  test("overrides Bootstrap's variables with hex colors whatever the color format", () => {
    const bootstrap = toBootstrapVariables({
      ...withRoles,
      meta: { ...withRoles.meta, colorFormat: "oklch" },
      semantic: [...withRoles.semantic, { name: "accent", ref: "indigo", value: fromHex("#a5b4fc") }],
      radius: [
        { name: "sm", px: 4 },
        { name: "md", px: 8 },
      ],
    });
    expect(bootstrap).toContain("$primary: #6366f1;\n");
    expect(bootstrap).toContain("$secondary: #a5b4fc;\n");
    expect(bootstrap).toContain("$body-color: #0f172a;\n");
    expect(bootstrap).toContain("$body-bg: #ffffff;\n");
    expect(bootstrap).toContain("$spacer: 1rem;\n");
    expect(bootstrap).toContain("$border-radius: 0.5rem;\n$border-radius-sm: 0.25rem;\n");
    expect(bootstrap).toContain("$box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);\n");
    expect(bootstrap).not.toContain("oklch");
  });

  test("writes font variables from the typography and skips what's missing", () => {
    const bootstrap = toBootstrapVariables({
      ...tokens(),
      typography: {
        heading: { family: "Space Grotesk", category: "sans-serif", weights: [600], italic: false, rank: 1 },
        body: { family: "Inter", category: "sans-serif", weights: [400], italic: false, rank: 1 },
        steps: [],
        rhythm: {
          headingWeight: 600,
          bodyWeight: 400,
          headingLineHeight: 1.1,
          bodyLineHeight: 1.6,
          headingTracking: 0,
          bodyTracking: 0,
        },
      },
    });
    expect(bootstrap).toContain('$font-family-sans-serif: "Inter", ');
    expect(bootstrap).toContain('$headings-font-family: "Space Grotesk", ');
    expect(bootstrap).toContain("$headings-font-weight: 600;\n");
    expect(bootstrap).toContain("$line-height-base: 1.6;\n");
    expect(bootstrap).not.toContain("$body-bg");
  });
});
