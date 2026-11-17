import "@/lib/i18n/areas/brand";
import { oklch, parseColor } from "@/lib/color/color";
import { LocalizedError, localized, type Localized } from "@/lib/i18n/errors";
import type { Oklch } from "@/types/color";

/**
 * Reads a W3C DTCG tokens file (the Export Engine's `tokens.json`) back into brand values.
 * Pure: nothing here touches a store, so the caller decides what to apply and can undo it.
 */

/** Same bounds as the Color Studio palette. */
const MIN_COLORS = 2;
const MAX_COLORS = 10;

/** The radius and spacing steps DesignHub writes, as multiples of their base (see lib/tokens/build.ts). */
const radiusSteps: Record<string, number> = { lg: 1, md: 2 / 3, xl: 4 / 3, "2xl": 2, sm: 1 / 3 };
const spacingSteps: Record<string, number> = { "2": 1, "1": 0.5, "3": 1.5, "4": 2, "6": 3, "8": 4, "12": 6 };
/** The ranges the Brand Studio sliders allow. */
const RADIUS_RANGE: [number, number] = [0, 32];
const SPACING_RANGE: [number, number] = [2, 12];

export type ImportedTokens = {
  /** Palette colors in file order, or null when the file has too few to use. */
  colors: Oklch[] | null;
  /** Gradient stops (position 0 to 100), or null when the file has none. */
  gradient: { color: Oklch; position: number }[] | null;
  headingFont: string | null;
  bodyFont: string | null;
  headingWeight: number | null;
  bodyWeight: number | null;
  /** Radius base in px (the `lg` step). */
  radiusBase: number | null;
  /** Spacing base in px (the `2` step). */
  spacingBase: number | null;
  /** Readable notes for anything found but not applied. */
  notes: Localized[];
  /** Tokens in the file that DesignHub doesn't import (semantic aliases, type sizes, unknown groups). */
  ignored: number;
};

export type ImportOptions = {
  /** Returns false for font families DesignHub can't load; those are skipped with a note. */
  isKnownFont?: (family: string) => boolean;
};

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
type Token = Json & { $value: unknown };
const isToken = (value: unknown): value is Token => isObject(value) && "$value" in value;

/** Counts every token (an object with `$value`) under a node. */
function countTokens(node: unknown): number {
  if (!isObject(node)) return 0;
  if (isToken(node)) return 1;
  return Object.entries(node).reduce((sum, [key, child]) => (key.startsWith("$") ? sum : sum + countTokens(child)), 0);
}

/** A DTCG color: the 2025 object form (oklch or srgb components, with a hex fallback) or a CSS color string. */
function readColor(value: unknown): Oklch | null {
  if (typeof value === "string") return value.startsWith("{") ? null : parseColor(value);
  if (!isObject(value)) return null;
  const alpha = isNumber(value.alpha) ? value.alpha : 1;
  const components = Array.isArray(value.components) ? value.components : null;
  if (components && components.length === 3 && components.every(isNumber)) {
    const [a, b, c] = components as [number, number, number];
    if (value.colorSpace === "oklch") return oklch(a, b, c, alpha);
    if (value.colorSpace === "srgb") {
      const channel = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255);
      const parsed = parseColor(`rgb(${channel(a)} ${channel(b)} ${channel(c)})`);
      return parsed ? { ...parsed, alpha } : null;
    }
  }
  if (typeof value.hex === "string") {
    const parsed = parseColor(value.hex);
    return parsed ? { ...parsed, alpha } : null;
  }
  return null;
}

/** A DTCG dimension in px: `{ value, unit }` (rem is 16px) or a legacy string such as "0.5rem". */
function readDimension(value: unknown): number | null {
  let amount: number | null = null;
  let unit = "";
  if (isObject(value) && isNumber(value.value) && typeof value.unit === "string") {
    amount = value.value;
    unit = value.unit;
  } else if (isNumber(value)) {
    amount = value;
    unit = "px";
  } else if (typeof value === "string") {
    const match = /^(-?\d*\.?\d+)(px|rem)?$/.exec(value.trim());
    if (match) {
      amount = Number(match[1]);
      unit = match[2] ?? "px";
    }
  }
  if (amount === null || amount < 0) return null;
  if (unit === "rem") return amount * 16;
  if (unit === "px") return amount;
  return null;
}

function readColors(group: Json, notes: Localized[]): Oklch[] | null {
  const colors: Oklch[] = [];
  for (const [name, node] of Object.entries(group)) {
    if (name.startsWith("$") || !isObject(node)) continue;
    // A palette color with shades keeps its base color under DEFAULT; shades are regenerated.
    const token = isToken(node) ? node : isToken(node.DEFAULT) ? node.DEFAULT : null;
    if (!token) continue;
    const type = token.$type ?? node.$type ?? group.$type;
    if (type !== undefined && type !== "color") continue;
    const color = readColor(token.$value);
    if (!color) throw new LocalizedError("error.tokens.badColor", { name });
    colors.push(color);
  }
  if (colors.length === 0) return null;
  if (colors.length < MIN_COLORS) {
    notes.push(localized("brand.import.note.tooFewColors", { min: MIN_COLORS }));
    return null;
  }
  if (colors.length > MAX_COLORS)
    notes.push(localized("brand.import.note.tooManyColors", { max: MAX_COLORS, count: colors.length }));
  return colors.slice(0, MAX_COLORS);
}

function readGradient(group: unknown): ImportedTokens["gradient"] {
  if (!isObject(group)) return null;
  const token = isToken(group.primary) ? group.primary : null;
  if (!token || !Array.isArray(token.$value)) return null;
  const stops = token.$value.flatMap((stop) => {
    if (!isObject(stop) || !isNumber(stop.position)) return [];
    const color = readColor(stop.color);
    return color ? [{ color, position: Math.min(100, Math.max(0, stop.position * 100)) }] : [];
  });
  return stops.length >= 2 ? stops : null;
}

function readFamily(token: unknown): string | null {
  if (!isToken(token)) return null;
  const value = Array.isArray(token.$value) ? token.$value[0] : token.$value;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readWeight(token: unknown): number | null {
  if (!isToken(token) || !isNumber(token.$value)) return null;
  const weight = token.$value;
  return weight >= 1 && weight <= 1000 ? Math.round(weight) : null;
}

/** Recovers a base size from whichever known step is present, preferring the step that equals the base. */
function readBase(
  group: unknown,
  steps: Record<string, number>,
  label: string,
  range: [number, number],
  notes: Localized[],
): number | null {
  if (!isObject(group)) return null;
  for (const [name, multiplier] of Object.entries(steps)) {
    const token = group[name];
    if (!isToken(token)) continue;
    const px = readDimension(token.$value);
    if (px === null)
      throw new LocalizedError(label === "radius" ? "error.tokens.badRadius" : "error.tokens.badSpacing", { name });
    const base = Math.round(px / multiplier);
    const clamped = Math.min(range[1], Math.max(range[0], base));
    if (clamped !== base)
      notes.push(
        localized(label === "radius" ? "brand.import.note.radiusRange" : "brand.import.note.spacingRange", {
          base,
          min: range[0],
          max: range[1],
          used: clamped,
        }),
      );
    return clamped;
  }
  return null;
}

/** Parses a tokens file. Throws a readable error for anything that isn't a usable DTCG tokens file. */
export function parseTokensFile(text: string, options: ImportOptions = {}): ImportedTokens {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new LocalizedError("error.file.json");
  }
  if (!isObject(data)) throw new LocalizedError("error.tokens.notTokens");
  if (data.format === "designhub.project" || data.format === "designhub.projects") {
    throw new LocalizedError("error.tokens.isProject");
  }

  const notes: Localized[] = [];
  const colors = isObject(data.color) ? readColors(data.color, notes) : null;
  const gradient = readGradient(data.gradient);

  const font = isObject(data.font) ? data.font : {};
  const family = isObject(font.family) ? font.family : {};
  const weight = isObject(font.weight) ? font.weight : {};
  const known = options.isKnownFont ?? (() => true);
  const pickFont = (role: string): string | null => {
    const name = readFamily(family[role]);
    if (name && !known(name)) {
      notes.push(
        localized(role === "heading" ? "brand.import.note.headingFont" : "brand.import.note.bodyFont", { name }),
      );
      return null;
    }
    return name;
  };
  const headingFont = pickFont("heading");
  const bodyFont = pickFont("body");
  const headingWeight = readWeight(weight.heading);
  const bodyWeight = readWeight(weight.body);
  const radiusBase = readBase(data.radius, radiusSteps, "radius", RADIUS_RANGE, notes);
  const spacingBase = readBase(data.spacing, spacingSteps, "spacing", SPACING_RANGE, notes);

  if (!colors && !headingFont && !bodyFont && radiusBase === null && spacingBase === null) {
    throw new LocalizedError(notes[0] ?? localized("error.tokens.empty"));
  }

  // Everything outside the groups read above (and type sizes, which follow the scale) is left alone.
  const used =
    (colors ? countTokens(data.color) : 0) +
    (gradient ? 1 : 0) +
    countTokens(font.family) +
    countTokens(font.weight) +
    countTokens(data.radius) +
    countTokens(data.spacing);
  const ignored = Math.max(0, countTokens(data) - used);

  return {
    colors,
    gradient,
    headingFont,
    bodyFont,
    headingWeight,
    bodyWeight,
    radiusBase,
    spacingBase,
    notes,
    ignored,
  };
}

/** One line per applied group, for the import toast. */
export function summarizeImport(imported: ImportedTokens): Localized[] {
  const lines: Localized[] = [];
  if (imported.colors) lines.push(localized("brand.import.summary.colors", { count: imported.colors.length }));
  if (imported.gradient) lines.push(localized("brand.import.summary.gradient"));
  if (imported.headingFont) lines.push(localized("brand.import.summary.headingFont", { name: imported.headingFont }));
  if (imported.bodyFont) lines.push(localized("brand.import.summary.bodyFont", { name: imported.bodyFont }));
  if (imported.radiusBase !== null)
    lines.push(localized("brand.import.summary.radius", { value: imported.radiusBase }));
  if (imported.spacingBase !== null)
    lines.push(localized("brand.import.summary.spacing", { value: imported.spacingBase }));
  if (imported.ignored) lines.push(localized("brand.import.summary.ignored", { count: imported.ignored }));
  return lines;
}
