import {
  BAD,
  caption,
  card,
  checkIcon,
  CONTENT_BOTTOM,
  CONTENT_TOP,
  CONTENT_WIDTH,
  GOOD,
  guidelinePage,
  MARGIN,
  paragraph,
} from "@/lib/guidelines/kit";
import type { GuidelinePage } from "@/lib/guidelines/types";
import { text } from "@/lib/mockups/kit";

/** The base duration every other duration is derived from, in ms. */
export const MOTION_BASE = 250;

export type MotionDurations = { fast: number; base: number; slow: number };

const toTen = (value: number) => Math.max(10, Math.round(value / 10) * 10);

/** Fast, base and slow durations from one base value: 0.6x and 1.6x, rounded to 10 ms (150, 250 and 400 at 250). */
export function motionDurations(base = MOTION_BASE): MotionDurations {
  return { fast: toTen(base * 0.6), base: toTen(base), slow: toTen(base * 1.6) };
}

/** A CSS cubic-bezier curve: the two control points (x1, y1) and (x2, y2). The ends are fixed at (0, 0) and (1, 1). */
export type Easing = { name: string; use: string; curve: [number, number, number, number] };

export const EASINGS: Easing[] = [
  { name: "Enter", use: "Ease out: quick start, soft landing", curve: [0.16, 1, 0.3, 1] },
  { name: "Exit", use: "Ease in: gathers speed, then leaves", curve: [0.7, 0, 0.84, 0] },
  { name: "Move", use: "Ease in out: for things that stay on screen", curve: [0.65, 0, 0.35, 1] },
];

export const cssEasing = ({ curve }: Easing) => `cubic-bezier(${curve.join(", ")})`;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The curve as an SVG path in a square plot at (x, y). Time runs left to right and progress runs up, so
 * the curve starts at the bottom left and ends at the top right, and a control point's y is flipped.
 */
export function easingPath(curve: Easing["curve"], x: number, y: number, size: number): string {
  const [x1, y1, x2, y2] = curve;
  const point = (px: number, py: number) => `${round(x + px * size)} ${round(y + size - py * size)}`;
  return `M${point(0, 0)} C${point(x1, y1)}, ${point(x2, y2)}, ${point(1, 1)}`;
}

/** A point on the curve at time t (0 to 1), as progress against time. */
export function easingAt(curve: Easing["curve"], t: number): { time: number; progress: number } {
  const [x1, y1, x2, y2] = curve;
  const mix = (a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  return { time: mix(x1, x2), progress: mix(y1, y2) };
}

const DO = [
  "Keep interface motion between 150 and 400 ms.",
  "Ease out when something enters and ease in when it leaves.",
  "Animate transform and opacity: they stay smooth on any device.",
];

const DONT = [
  "Animate width, height or position: it makes the layout jump.",
  "Loop motion that is not a loading or progress state.",
  "Make people wait for an animation to finish before they can act.",
];

const REDUCED =
  "When someone asks their device for less motion (prefers-reduced-motion: reduce), remove movement and loops. Keep short fades and color changes so each change stays visible.";

export const motionPage: GuidelinePage = {
  id: "motion",
  section: "UI",
  title: "Motion",
  description: "Durations, easing curves, do's and don'ts for animation, and how to respect reduced motion.",
  render(ctx, number) {
    const { surface } = ctx;
    const colW = (CONTENT_WIDTH - 60) / 2;
    const rx = MARGIN + colW + 60;

    // Durations: one bar per duration, drawn in proportion to its length.
    const durations = motionDurations();
    const rows: { name: string; ms: number; use: string }[] = [
      { name: "Fast", ms: durations.fast, use: "Hover, focus and small changes" },
      { name: "Base", ms: durations.base, use: "Menus, tabs and tooltips" },
      { name: "Slow", ms: durations.slow, use: "Dialogs and page transitions" },
    ];
    const labelW = 140;
    const maxBar = colW - labelW;
    const bars = rows
      .map((row, i) => {
        const y = CONTENT_TOP + 28 + i * 66;
        return `${text(MARGIN, y + 16, row.name, { size: 18, fill: surface.text, font: "bb" })}
          ${text(MARGIN, y + 38, `${row.ms} ms`, { size: 14, fill: surface.muted })}
          <rect x="${MARGIN + labelW}" y="${y}" width="${maxBar}" height="22" rx="4" fill="${surface.primary}" fill-opacity=".14"/>
          <rect x="${MARGIN + labelW}" y="${y}" width="${round((row.ms / durations.slow) * maxBar)}" height="22" rx="4" fill="${surface.primary}"/>
          ${text(MARGIN + labelW, y + 42, row.use, { size: 14, fill: surface.muted })}`;
      })
      .join("");

    // Easing curves: each in its own square, with the straight line (no easing) for comparison.
    const plot = 170;
    const gap = (colW - plot * EASINGS.length) / (EASINGS.length - 1);
    const plotTop = CONTENT_TOP + 28 + 3 * 66 + 74;
    const curves = EASINGS.map((easing, i) => {
      const x = MARGIN + i * (plot + gap);
      return `<rect x="${x}" y="${plotTop}" width="${plot}" height="${plot}" rx="8" fill="${surface.surface}" stroke="${surface.border}"/>
        <path d="${easingPath([0, 0, 1, 1], x, plotTop, plot)}" fill="none" stroke="${surface.muted}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 6"/>
        <path d="${easingPath(easing.curve, x, plotTop, plot)}" fill="none" stroke="${surface.primary}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="${x}" cy="${plotTop + plot}" r="5" fill="${surface.primary}"/>
        <circle cx="${x + plot}" cy="${plotTop}" r="5" fill="${surface.primary}"/>
        ${text(x, plotTop + plot + 30, easing.name, { size: 18, fill: surface.text, font: "bb" })}
        ${text(x, plotTop + plot + 52, cssEasing(easing), { size: 12, fill: surface.muted })}`;
    }).join("");

    // Do's and don'ts, each with the kit's check or cross.
    const list = (items: string[], top: number, color: string, ok: boolean) =>
      items
        .map((item, i) => {
          const y = top + i * 62;
          return `${checkIcon(rx + 13, y + 10, color, ok)}
            ${paragraph(ctx, item, rx + 44, y + 16, colW - 44, 18, surface.text, 2)}`;
        })
        .join("");

    const noteTop = CONTENT_BOTTOM - 150;
    const markup = `${caption(ctx, MARGIN, CONTENT_TOP, "Durations")}
      ${bars}
      ${text(MARGIN, CONTENT_BOTTOM + 6, `One base value, ${durations.base} ms: fast is 0.6x and slow is 1.6x`, { size: 13, fill: surface.muted })}
      ${caption(ctx, MARGIN, plotTop - 22, "Easing curves")}
      ${curves}
      ${caption(ctx, rx, CONTENT_TOP, "Do")}
      ${list(DO, CONTENT_TOP + 28, GOOD, true)}
      ${caption(ctx, rx, CONTENT_TOP + 28 + 3 * 62 + 24, "Don't")}
      ${list(DONT, CONTENT_TOP + 28 + 3 * 62 + 52, BAD, false)}
      ${card(ctx, rx, noteTop, colW, 150)}
      ${caption(ctx, rx + 24, noteTop + 36, "Reduced motion")}
      ${paragraph(ctx, REDUCED, rx + 24, noteTop + 68, colW - 48, 16, surface.text, 4)}`;

    return guidelinePage(
      ctx,
      number,
      {
        section: "Motion",
        title: "Motion",
        lead: "Motion explains what changed. Keep it quick, calm and easy to turn off.",
      },
      markup,
    );
  },
};
