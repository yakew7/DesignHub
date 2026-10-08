import type { CssDeclaration, EffectCss } from "@/types/effects";

export function cssRule(selector: string, declarations: CssDeclaration[]): string {
  const body = declarations.map(({ property, value }) => `  ${property}: ${value};`).join("\n");
  return `${selector} {\n${body}\n}\n`;
}

/** Full stylesheet for an effect: the main rule, pseudo-element rules, then global at-rules. */
export function effectStylesheet(effect: EffectCss, selector: string): string {
  const parts = [cssRule(selector, effect.declarations).trim(), effect.extra?.(selector).trim(), effect.global?.trim()];
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

function indent(text: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line ? pad + line : line))
    .join("\n");
}

function declarationLines(effect: EffectCss): string {
  return effect.declarations.map(({ property, value }) => `  ${property}: ${value};`).join("\n");
}

/** Tailwind v4 custom utility (`class="glass"`). Pseudo-elements nest with `&`. */
export function tailwindUtility(name: string, effect: EffectCss): string {
  const nested = effect.extra?.("&").trim();
  const utility = `@utility ${name} {\n${declarationLines(effect)}${nested ? `\n\n${indent(nested)}` : ""}\n}`;
  return `${[effect.global?.trim(), utility].filter(Boolean).join("\n\n")}\n`;
}

/** SCSS mixin: `.card { @include glass; }` */
export function scssMixin(name: string, effect: EffectCss): string {
  const nested = effect.extra?.("&").trim();
  const mixin = `@mixin ${name} {\n${declarationLines(effect)}${nested ? `\n\n${indent(nested)}` : ""}\n}`;
  return `${[effect.global?.trim(), mixin].filter(Boolean).join("\n\n")}\n`;
}

/** `backdrop-filter` → `backdropFilter`, `-webkit-backdrop-filter` → `WebkitBackdropFilter`. */
export function camelCase(property: string): string {
  const vendor = property.startsWith("-webkit-");
  const base = (vendor ? property.slice(8) : property).replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
  return vendor ? `Webkit${base.charAt(0).toUpperCase()}${base.slice(1)}` : base;
}

/** React inline-style object. Pseudo-elements and keyframes can't live in inline styles, so they're noted. */
export function reactStyle(name: string, effect: EffectCss): string {
  const entries = effect.declarations.map(
    ({ property, value }) => `  ${camelCase(property)}: ${JSON.stringify(value)},`,
  );
  const note =
    effect.extra || effect.global
      ? "\n// This effect also needs the extra rules from the CSS tab (pseudo-elements / keyframes).\n"
      : "";
  return `import type { CSSProperties } from "react";\n${note}\nexport const ${camelCase(name)}Style: CSSProperties = {\n${entries.join("\n")}\n};\n`;
}

/** Tailwind arbitrary-value syntax: spaces become underscores, literal underscores are escaped. */
export function tailwindValue(value: string): string {
  return value
    .replace(/_/g, "\\_")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, "_");
}

/**
 * Arbitrary properties (`[backdrop-filter:blur(12px)]`) work for any declaration in Tailwind v3.2+ and v4.
 * Tailwind adds vendor prefixes itself, so a -webkit- twin of an unprefixed declaration is left out;
 * prefixed-only properties such as -webkit-text-fill-color are kept.
 */
export function tailwindClasses(declarations: CssDeclaration[]): string {
  const unprefixed = new Set(declarations.map(({ property }) => property));
  return declarations
    .filter(({ property }) => !(property.startsWith("-webkit-") && unprefixed.has(property.slice(8))))
    .map(({ property, value }) => `[${property}:${tailwindValue(value)}]`)
    .join(" ");
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.replace(/./g, (char) => char + char) : clean.slice(0, 6);
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgb(${r} ${g} ${b} / ${Math.round(alpha * 1000) / 1000})`;
}

export const px = (value: number) => (value === 0 ? "0" : `${Math.round(value * 100) / 100}px`);
