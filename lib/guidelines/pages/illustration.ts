import { BAD, caption, checkIcon, CONTENT_TOP, GOOD, guidelinePage, MARGIN, paragraph } from "@/lib/guidelines/kit";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { text } from "@/lib/mockups/kit";

export type IllustrationCorner = "sharp" | "soft" | "round";

export type IllustrationStyle = {
  corner: IllustrationCorner;
  /** Stroke width in px: heavier for rounder brands. */
  weight: number;
  /** The corner radius used in examples, capped so it fits a small shape. */
  cornerRadius: number;
  cap: "butt" | "round";
  join: "miter" | "round";
};

/**
 * The drawing style the brand's corner radius implies: sharp brands get thin, mitred lines, soft ones
 * a medium line with round ends, and round ones a heavy, fully rounded line. One radius drives the
 * whole style, so it can never disagree with the UI.
 */
export function illustrationStyle(radius: number): IllustrationStyle {
  if (radius <= 2) return { corner: "sharp", weight: 2, cornerRadius: 0, cap: "butt", join: "miter" };
  if (radius <= 12) {
    return { corner: "soft", weight: 3, cornerRadius: Math.round(radius), cap: "round", join: "round" };
  }
  return { corner: "round", weight: 4, cornerRadius: Math.min(Math.round(radius), 24), cap: "round", join: "round" };
}

const CORNER_LABEL: Record<IllustrationCorner, string> = { sharp: "Sharp", soft: "Soft", round: "Round" };

type Sketch = {
  /** Stroke width of the outline, the detail lines and the accent. */
  strokes: [outline: number, detail: number, accent: number];
  /** Corner radius of the card, the button and the chip. */
  radii: [card: number, button: number, chip: number];
  /** Fill of the card, the sun-like circle and the button; line color. */
  colors: { card: string; circle: string; button: string; line: string };
  cap: "butt" | "round";
  join: "miter" | "round";
};

/** A small scene of simple shapes: a card, a circle, two lines and a button. */
function sketch(x: number, y: number, w: number, h: number, s: Sketch): string {
  const line = (width: number) =>
    `stroke="${s.colors.line}" stroke-width="${width}" stroke-linecap="${s.cap}" stroke-linejoin="${s.join}"`;
  const pad = 22;
  const cardW = w - pad * 2;
  const cardH = h - pad * 2;
  const cx = x + pad;
  const cy = y + pad;
  return `<rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="${s.radii[0]}" fill="${s.colors.card}" ${line(s.strokes[0])}/>
    <circle cx="${cx + 44}" cy="${cy + 44}" r="22" fill="${s.colors.circle}" ${line(s.strokes[2])}/>
    <path d="M${cx + 86} ${cy + 36} H${cx + cardW - 24} M${cx + 86} ${cy + 56} H${cx + cardW - 60}" fill="none" ${line(s.strokes[1])}/>
    <rect x="${cx + 24}" y="${cy + cardH - 48}" width="84" height="28" rx="${s.radii[1]}" fill="${s.colors.button}" ${line(s.strokes[1])}/>
    <rect x="${cx + cardW - 74}" y="${cy + cardH - 46}" width="50" height="24" rx="${s.radii[2]}" fill="none" ${line(s.strokes[1])}/>`;
}

const TILE_W = 244;
const TILE_H = 170;
const GAP = 24;
const ROW = TILE_H + 78;

function tile(
  ctx: GuidelineContext,
  column: number,
  row: number,
  left: number,
  label: string,
  ok: boolean,
  art: (x: number, y: number) => string,
): string {
  const x = left + column * (TILE_W + GAP);
  const y = CONTENT_TOP + 40 + row * ROW;
  const { surface } = ctx;
  return `<rect x="${x}" y="${y}" width="${TILE_W}" height="${TILE_H}" rx="12" fill="${surface.background}" stroke="${surface.border}"/>
    ${art(x, y)}
    ${checkIcon(x + 14, y + TILE_H + 28, ok ? GOOD : BAD, ok)}
    ${text(x + 38, y + TILE_H + 34, label, { size: 16, fill: surface.text })}`;
}

/** Share of the artwork each palette role should cover, largest first. */
export const PALETTE_SHARES = [
  { role: "Neutral", share: 60 },
  { role: "Primary", share: 30 },
  { role: "Secondary", share: 10 },
] as const;

export const illustrationPage: GuidelinePage = {
  id: "illustration",
  section: "Imagery",
  title: "Illustration",
  description: "Line weight, corner style, palette use and do and don't examples for illustrations.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const style = illustrationStyle(brand.radius);
    const leftW = 520;
    const rx = MARGIN + leftW + 80;
    const ruleWidth = leftW - 40;
    const line = `stroke="${surface.text}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}"`;

    // Left column: the three style rules, each with a sample.
    const weights = [style.weight / 2, style.weight, style.weight * 2];
    const weightRow = weights
      .map((width, i) => {
        const y = CONTENT_TOP + 78 + i * 22;
        const mark = i === 1 ? " (the brand line)" : "";
        return `<path d="M${MARGIN} ${y} H${MARGIN + 150}" fill="none" ${line} stroke-width="${width}" opacity="${i === 1 ? 1 : 0.35}"/>
          ${text(MARGIN + 170, y + 5, `${width}px${mark}`, { size: 15, fill: i === 1 ? surface.text : surface.muted })}`;
      })
      .join("");
    const cornerY = CONTENT_TOP + 232;
    const paletteY = CONTENT_TOP + 428;
    const barW = leftW - 40;
    let offset = 0;
    const colors = [surface.surface, surface.primary, surface.secondary];
    const bars = PALETTE_SHARES.map((part, i) => {
      const w = (barW * part.share) / 100;
      const markup = `<rect x="${MARGIN + offset}" y="${paletteY + 18}" width="${w}" height="34" ${i === 0 ? `fill="${colors[i]}" stroke="${surface.border}"` : `fill="${colors[i]}"`}/>
        ${text(MARGIN + offset, paletteY + 80, `${part.role} ${part.share}%`, { size: 15, fill: surface.muted })}`;
      offset += w;
      return markup;
    }).join("");

    const left = `${caption(ctx, MARGIN, CONTENT_TOP + 16, "Line weight")}
      ${paragraph(ctx, `One stroke width, ${style.weight}px, on every illustration. ${style.cap === "round" ? "Ends and joins are rounded." : "Ends are flat and joins are mitred."}`, MARGIN, CONTENT_TOP + 44, ruleWidth, 16, surface.text, 2)}
      ${weightRow}
      ${caption(ctx, MARGIN, cornerY, "Corner style")}
      ${paragraph(ctx, `${CORNER_LABEL[style.corner]} corners, ${style.cornerRadius}px, matching the brand radius.`, MARGIN, cornerY + 28, ruleWidth, 16, surface.text, 2)}
      <rect x="${MARGIN}" y="${cornerY + 76}" width="150" height="86" rx="${style.cornerRadius}" fill="${surface.surface}" ${line} stroke-width="${style.weight}"/>
      ${caption(ctx, MARGIN, paletteY, "Palette use")}
      ${bars}
      ${paragraph(ctx, "Mostly neutral, with primary for the focus and secondary as a small accent.", MARGIN, paletteY + 112, ruleWidth, 16, surface.text, 2)}`;

    const base: Sketch = {
      strokes: [style.weight, style.weight, style.weight],
      radii: [style.cornerRadius, style.cornerRadius, style.cornerRadius],
      colors: { card: surface.surface, circle: surface.secondary, button: surface.primary, line: surface.text },
      cap: style.cap,
      join: style.join,
    };
    const off = ["#a16207", "#84cc16", "#e11d48"];
    const tiles = [
      tile(ctx, 0, 0, rx, "One line weight", true, (x, y) => sketch(x, y, TILE_W, TILE_H, base)),
      tile(ctx, 1, 0, rx, "Brand corners", true, (x, y) =>
        sketch(x, y, TILE_W, TILE_H, {
          ...base,
          radii: [style.cornerRadius + 4, style.cornerRadius, style.cornerRadius],
        }),
      ),
      tile(ctx, 2, 0, rx, "Brand palette", true, (x, y) =>
        sketch(x, y, TILE_W, TILE_H, { ...base, colors: { ...base.colors, card: surface.background } }),
      ),
      tile(ctx, 0, 1, rx, "Mixed line weights", false, (x, y) =>
        sketch(x, y, TILE_W, TILE_H, { ...base, strokes: [1, style.weight * 2 + 2, 7] }),
      ),
      tile(ctx, 1, 1, rx, "Mixed corner styles", false, (x, y) =>
        sketch(x, y, TILE_W, TILE_H, { ...base, radii: [0, 14, 0] }),
      ),
      tile(ctx, 2, 1, rx, "Off-brand colors", false, (x, y) =>
        sketch(x, y, TILE_W, TILE_H, {
          ...base,
          colors: { card: "#fef3c7", circle: off[0]!, button: off[1]!, line: off[2]! },
        }),
      ),
    ].join("");

    return guidelinePage(
      ctx,
      number,
      {
        section: "Illustration",
        title: "Illustration",
        lead: "Illustrations use simple shapes, one line weight and the brand's corners and colors, so they read as part of the same family.",
      },
      `${left}
      ${caption(ctx, rx, CONTENT_TOP + 16, "Do")}${caption(ctx, rx, CONTENT_TOP + 16 + ROW, "Don't")}${tiles}`,
    );
  },
};
