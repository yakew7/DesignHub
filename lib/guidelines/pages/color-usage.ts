import { colorDistance, contrastRatio, oklch, parseColor, toHex } from "@/lib/color/color";
import { formatRatio, ratingLabel } from "@/lib/color/contrast";
import {
  BAD,
  caption,
  card,
  checkIcon,
  CONTENT_BOTTOM,
  CONTENT_TOP,
  CONTENT_WIDTH,
  guidelinePage,
  MARGIN,
} from "@/lib/guidelines/kit";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { text, truncate } from "@/lib/mockups/kit";
import type { ColorRole } from "@/types/brand";

type Swatch = { name: string; hex: string };

export type ColorShare = {
  role: ColorRole;
  label: string;
  /** Percent of a layout, from the 60 / 30 / 10 rule. */
  share: number;
  colors: Swatch[];
  usage: string;
};

export type TextCombination = {
  background: Swatch;
  foreground: Swatch;
  ratio: number;
  rating: ReturnType<typeof ratingLabel>;
};

/** Normal text needs 4.5:1 (WCAG 2.2 AA); a combination below that is not approved for text. */
const TEXT_MIN = 4.5;
/** Swatches closer than this (ΔE OK) read as one color rather than a text-on-color pair. */
const DISTINCT = 0.15;
const PAGE_BACKGROUND = "page background";

const ratio = (a: string, b: string) => {
  const x = parseColor(a);
  const y = parseColor(b);
  return x && y ? contrastRatio(x, y) : 1;
};

/** The palette plus the page background and text derived from it, as text and background candidates. */
function candidates(ctx: GuidelineContext): Swatch[] {
  const { surface, brand } = ctx;
  const all: Swatch[] = [
    ...brand.colors.all.map(({ name, hex }) => ({ name, hex })),
    { name: PAGE_BACKGROUND, hex: surface.background },
    { name: "body text", hex: surface.text },
  ];
  return all.filter(
    (swatch, i) => all.findIndex((other) => other.hex.toLowerCase() === swatch.hex.toLowerCase()) === i,
  );
}

/**
 * 60 / 30 / 10 from the color roles: neutrals dominate, secondary colors support and the primary
 * is the accent. A role with no colors hands its share to the neutrals, which always include the
 * page background.
 */
export function colorProportions(ctx: GuidelineContext): ColorShare[] {
  const { brand, surface } = ctx;
  const pick = (role: ColorRole) =>
    brand.colors.all.filter((color) => color.role === role).map(({ name, hex }) => ({ name, hex }));
  const neutrals = pick("neutral");
  const groups: ColorShare[] = [
    {
      role: "neutral",
      label: "Dominant",
      share: 60,
      colors: neutrals.length ? neutrals : [{ name: PAGE_BACKGROUND, hex: surface.background }],
      usage: "Backgrounds, surfaces and body text",
    },
    {
      role: "secondary",
      label: "Secondary",
      share: 30,
      colors: pick("secondary"),
      usage: "Supporting shapes, illustration and charts",
    },
    { role: "primary", label: "Accent", share: 10, colors: pick("primary"), usage: "Actions, links and highlights" },
  ];
  const spare = groups.filter((group) => group.colors.length === 0).reduce((sum, group) => sum + group.share, 0);
  return groups
    .filter((group) => group.colors.length > 0)
    .map((group) => (group.role === "neutral" ? { ...group, share: group.share + spare } : group));
}

/**
 * The most legible palette text color on each palette color and on the page background, kept
 * only when it reaches 4.5:1. Ratios come from the live palette.
 */
export function textCombinations(ctx: GuidelineContext, limit = 6): TextCombination[] {
  const pool = candidates(ctx);
  const backgrounds = [
    ...ctx.brand.colors.all.map(({ name, hex }) => ({ name, hex })),
    pool.find((c) => c.name === PAGE_BACKGROUND),
  ];
  const combos: TextCombination[] = [];
  for (const background of backgrounds) {
    if (!background) continue;
    let best: TextCombination | null = null;
    for (const foreground of pool) {
      if (foreground.hex.toLowerCase() === background.hex.toLowerCase()) continue;
      const value = ratio(foreground.hex, background.hex);
      if (!best || value > best.ratio) best = { background, foreground, ratio: value, rating: ratingLabel(value) };
    }
    if (best && best.ratio >= TEXT_MIN && !combos.some((c) => c.background.hex === background.hex)) combos.push(best);
  }
  return combos.slice(0, limit);
}

/**
 * A palette pair that fails 4.5:1 but is still clearly two colors, the kind of pair that tempts
 * people to set text in it. Prefers one under 3:1 so the problem is visible; null when every pair passes.
 */
export function lowContrastPair(ctx: GuidelineContext): TextCombination | null {
  const palette = ctx.brand.colors.all.map(({ name, hex }) => ({ name, hex }));
  const pool = palette.length >= 2 ? palette : candidates(ctx);
  const failing: TextCombination[] = [];
  pool.forEach((first, i) => {
    for (const second of pool.slice(i + 1)) {
      const a = parseColor(first.hex);
      const b = parseColor(second.hex);
      // Near-identical colors are one color, not a text-on-color pair.
      if (!a || !b || colorDistance(a, b) < DISTINCT) continue;
      const value = contrastRatio(a, b);
      if (value >= TEXT_MIN) continue;
      // The darker color as text on the lighter one.
      const darkerFirst = a.l <= b.l;
      failing.push({
        foreground: darkerFirst ? first : second,
        background: darkerFirst ? second : first,
        ratio: value,
        rating: ratingLabel(value),
      });
    }
  });
  const under3 = failing.filter((pair) => pair.ratio < 3);
  const pick = (list: TextCombination[]) => list.reduce((a, b) => (b.ratio > a.ratio ? b : a));
  if (under3.length) return pick(under3);
  return failing.length ? pick(failing) : null;
}

/** A clearly foreign color: the primary's hue turned to the spot furthest from every palette color. */
export function offPaletteColor(ctx: GuidelineContext): string {
  const palette = candidates(ctx).flatMap((swatch) => parseColor(swatch.hex) ?? []);
  const base = parseColor(ctx.surface.primary) ?? oklch(0.6, 0.15, 275);
  let best = { hex: "#00b3a4", distance: -1 };
  for (let turn = 30; turn < 360; turn += 30) {
    const candidate = oklch(0.66, Math.max(0.15, base.c), base.h + turn);
    const distance = Math.min(...palette.map((color) => colorDistance(color, candidate)));
    if (distance > best.distance) best = { hex: toHex(candidate), distance };
  }
  return best.hex;
}

/** Tile with artwork and a verdict bar along the bottom, matching the other do and don't pages. */
function dontTile(ctx: GuidelineContext, x: number, y: number, w: number, h: number, label: string, art: string) {
  const { surface } = ctx;
  const r = Math.min(ctx.brand.radius, 16);
  return `${card(ctx, x, y, w, h)}
    ${art}
    <rect x="${x}" y="${y + h - 56}" width="${w}" height="56" rx="${r}" fill="${surface.background}" fill-opacity=".92"/>
    ${checkIcon(x + 34, y + h - 28, BAD, false)}
    ${text(x + 60, y + h - 21, label, { size: 18, fill: surface.text })}`;
}

export const colorUsagePage: GuidelinePage = {
  id: "color-usage",
  title: "Color Usage",
  description: "Color proportions, approved text-on-color combinations and what to avoid.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const r = Math.min(brand.radius, 16);
    const colW = (CONTENT_WIDTH - 60) / 2;

    // Proportions: one bar split by share, each share split again between its colors.
    const shares = colorProportions(ctx);
    const barY = CONTENT_TOP + 24;
    const barH = 120;
    let bx = MARGIN;
    const segments = shares
      .flatMap((group) => {
        const w = (colW * group.share) / 100;
        const each = w / group.colors.length;
        return group.colors.map((color, i) => {
          const rect = `<rect x="${bx + i * each}" y="${barY}" width="${each + 0.5}" height="${barH}" fill="${color.hex}"/>`;
          if (i === group.colors.length - 1) bx += w;
          return rect;
        });
      })
      .join("");
    const bar = `<clipPath id="cu-bar"><rect x="${MARGIN}" y="${barY}" width="${colW}" height="${barH}" rx="${r}"/></clipPath>
      <g clip-path="url(#cu-bar)">${segments}</g>
      <rect x="${MARGIN}" y="${barY}" width="${colW}" height="${barH}" rx="${r}" fill="none" stroke="${surface.border}"/>`;
    const legend = shares
      .map((group, i) => {
        const y = barY + barH + 52 + i * 62;
        const chips = group.colors
          .slice(0, 5)
          .map(
            (color, j) =>
              `<rect x="${MARGIN + 92 + j * 26}" y="${y + 14}" width="20" height="20" rx="5" fill="${color.hex}" stroke="${surface.border}"/>`,
          )
          .join("");
        const names = group.colors.map((color) => color.name).join(", ");
        return `${text(MARGIN, y, `${group.share}%`, { size: 30, fill: surface.text, font: "h" })}
          ${text(MARGIN + 92, y, `${group.label}: ${group.usage}`, { size: 17, fill: surface.text, font: "bb" })}
          ${chips}
          ${text(MARGIN + 92 + Math.min(group.colors.length, 5) * 26 + 6, y + 30, names, { size: 14, fill: surface.muted })}`;
      })
      .join("");

    // Approved text on color: the best palette text color on each background, with its real ratio.
    const cx = MARGIN + colW + 60;
    const combos = textCombinations(ctx);
    const cols = 3;
    const gap = 16;
    const tileW = (colW - gap * (cols - 1)) / cols;
    const tileH = 150;
    const tiles = combos
      .map((combo, i) => {
        const x = cx + (i % cols) * (tileW + gap);
        const y = barY + Math.floor(i / cols) * (tileH + gap);
        const fg = combo.foreground.hex;
        return `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="${r}" fill="${combo.background.hex}" stroke="${surface.border}"/>
          <text class="h" x="${x + 20}" y="${y + 58}" font-size="40" fill="${fg}">Aa</text>
          ${text(x + tileW - 20, y + 40, combo.rating, { size: 14, fill: fg, font: "bb", anchor: "end" })}
          ${text(x + 20, y + 92, truncate(ctx, combo.foreground.name, tileW - 40, 15), { size: 15, fill: fg })}
          ${text(x + 20, y + 114.5, truncate(ctx, `on ${combo.background.name}`, tileW - 40, 15), { size: 15, fill: fg })}
          ${text(x + 20, y + 136, formatRatio(combo.ratio), { size: 15, fill: fg, font: "bb" })}`;
      })
      .join("");
    const empty = combos.length
      ? ""
      : text(cx, barY + 40, "No palette pair reaches 4.5:1. Add a darker or lighter neutral.", {
          size: 17,
          fill: surface.text,
        });

    // Don'ts: the palette's own least legible pair, and a color from outside the palette.
    const dy = barY + 2 * (tileH + gap) + 40;
    const dh = CONTENT_BOTTOM - dy;
    const low = lowContrastPair(ctx);
    const lowArt = low
      ? `<rect x="${MARGIN + 24}" y="${dy + 24}" width="${colW - 48}" height="${dh - 104}" rx="${r}" fill="${low.background.hex}"/>
        <text class="h" x="${MARGIN + 56}" y="${dy + 24 + (dh - 104) / 2 + 12}" font-size="34" fill="${low.foreground.hex}">Hard to read</text>
        ${text(MARGIN + colW - 56, dy + 24 + (dh - 104) / 2 + 8, formatRatio(low.ratio), { size: 20, fill: low.foreground.hex, font: "bb", anchor: "end" })}`
      : "";
    const lowLabel = low
      ? `Don't set text in ${low.foreground.name} on ${low.background.name} (${formatRatio(low.ratio)})`
      : "Don't set text below 4.5:1";
    const foreign = offPaletteColor(ctx);
    const ox = MARGIN + colW + 60;
    const btnW = 200;
    const offArt = `<rect x="${ox + 24}" y="${dy + 24}" width="${colW - 48}" height="${dh - 104}" rx="${r}" fill="${surface.background}" stroke="${surface.border}"/>
      <rect x="${ox + 56}" y="${dy + 24 + (dh - 104) / 2 - 26}" width="${btnW}" height="52" rx="${r}" fill="${foreign}"/>
      ${text(ox + 56 + btnW / 2, dy + 24 + (dh - 104) / 2 + 7, "Sign up", { size: 19, fill: ratio(foreign, "#ffffff") >= ratio(foreign, "#111111") ? "#ffffff" : "#111111", font: "bb", anchor: "middle" })}
      <rect x="${ox + 56 + btnW + 24}" y="${dy + 24 + (dh - 104) / 2 - 26}" width="${btnW}" height="52" rx="${r}" fill="${surface.primary}"/>
      ${text(ox + 56 + btnW * 1.5 + 24, dy + 24 + (dh - 104) / 2 + 7, "Log in", { size: 19, fill: ratio(surface.primary, "#ffffff") >= ratio(surface.primary, "#111111") ? "#ffffff" : "#111111", font: "bb", anchor: "middle" })}`;

    const body = `${caption(ctx, MARGIN, CONTENT_TOP, "Proportions")}
      ${bar}
      ${legend}
      ${caption(ctx, cx, CONTENT_TOP, "Approved text on color")}
      ${tiles}${empty}
      ${dontTile(ctx, MARGIN, dy, colW, dh, lowLabel, lowArt)}
      ${dontTile(ctx, ox, dy, colW, dh, `Don't add colors outside the palette (${foreign.toUpperCase()})`, offArt)}`;

    return guidelinePage(
      ctx,
      number,
      {
        section: "Color",
        title: "Color usage",
        lead: "How much of each color to use, and which pairs are approved for text.",
      },
      body,
    );
  },
};
