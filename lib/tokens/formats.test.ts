import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import { tokenFormats, toJsModule, toScss, toStylus } from "@/lib/tokens/formats";
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
    expect.arrayContaining(["tokens.mjs", "tokens.styl", "Theme.kt"]),
  );
});
