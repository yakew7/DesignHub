import { colorDistance, oklch, parseColor, toHex } from "@/lib/color/color";
import { simulatedDistance, type VisionType } from "@/lib/color/vision";
import {
  caption,
  card,
  CONTENT_BOTTOM,
  CONTENT_TOP,
  CONTENT_WIDTH,
  guidelinePage,
  MARGIN,
  paragraph,
} from "@/lib/guidelines/kit";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { text, truncate } from "@/lib/mockups/kit";
import type { Oklch } from "@/types/color";

/** The ways of seeing a chart has to survive, besides normal vision. */
const VISIONS: VisionType[] = ["normal", "protanopia", "deuteranopia", "tritanopia"];

/** Categorical series colors, one per series. */
export const SERIES = 6;
/** The smallest difference (ΔE OK) the palette should keep between any two series under any vision. */
export const MIN_SERIES_DISTANCE = 0.06;

export type SeriesColor = { hex: string; name: string };

/** The smallest distance between two colors across normal vision and the three color blindness types. */
export function worstDistance(a: Oklch, b: Oklch): number {
  return Math.min(
    ...VISIONS.map((vision) => (vision === "normal" ? colorDistance(a, b) : simulatedDistance(a, b, vision))),
  );
}

const primaryOf = (ctx: GuidelineContext): Oklch => parseColor(ctx.surface.primary) ?? oklch(0.6, 0.18, 275);

/**
 * Series colors for charts: the brand's chromatic colors plus a ring of hues around the primary,
 * picked greedily so each new color is as far as possible (under every vision type) from those
 * already chosen. The first is always the primary, so charts lead with the brand.
 */
export function categoricalColors(ctx: GuidelineContext, count = SERIES): SeriesColor[] {
  const primary = primaryOf(ctx);
  const fromBrand = ctx.brand.colors.all
    .map((color) => ({ name: color.name, color: parseColor(color.hex) }))
    .filter((item): item is { name: string; color: Oklch } => item.color !== null && item.color.c >= 0.04);
  const ring = Array.from({ length: 12 }, (_, i) => ({
    name: `Hue ${i + 1}`,
    color: oklch(0.68, Math.max(0.12, Math.min(0.17, primary.c)), (primary.h + i * 30) % 360),
  }));
  const pool = [...fromBrand, ...ring];
  const chosen: { name: string; color: Oklch }[] = [{ name: "Primary", color: primary }];
  while (chosen.length < count) {
    let best: { name: string; color: Oklch } | null = null;
    let bestDistance = -1;
    for (const item of pool) {
      const distance = Math.min(...chosen.map((picked) => worstDistance(picked.color, item.color)));
      if (distance > bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    if (!best) break;
    chosen.push(best);
    pool.splice(pool.indexOf(best), 1);
  }
  return chosen.map((item, i) => ({ hex: toHex(item.color), name: i === 0 ? "Primary" : `Series ${i + 1}` }));
}

/** Smallest worst-case distance between any two of the colors, for the page's check. */
export function seriesSeparation(colors: SeriesColor[]): number {
  let min = Infinity;
  colors.forEach((a, i) => {
    for (const b of colors.slice(i + 1)) {
      const x = parseColor(a.hex);
      const y = parseColor(b.hex);
      if (x && y) min = Math.min(min, worstDistance(x, y));
    }
  });
  return min === Infinity ? 0 : min;
}

/** A light-to-dark ramp in the primary's hue: lightness falls evenly, chroma peaks in the middle. */
export function sequentialRamp(ctx: GuidelineContext, steps = 7): string[] {
  const primary = primaryOf(ctx);
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    return toHex(
      oklch(
        0.96 - t * 0.64,
        Math.min(0.2, primary.c) * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1))),
        primary.h,
      ),
    );
  });
}

/** Two hues meeting at a near-neutral middle: the primary on one side, its opposite on the other. */
export function divergingRamp(ctx: GuidelineContext, steps = 7): string[] {
  const primary = primaryOf(ctx);
  const half = Math.floor(steps / 2);
  const chroma = Math.min(0.17, Math.max(0.1, primary.c));
  return Array.from({ length: steps }, (_, i) => {
    const distance = Math.abs(i - half) / half;
    const hue = i < half ? primary.h : (primary.h + 180) % 360;
    return toHex(oklch(0.96 - distance * 0.4, i === half ? 0.01 : chroma * (0.35 + 0.65 * distance), hue));
  });
}

/** Bar heights for the sample chart, one per series, fixed so the page doesn't move between renders. */
const SAMPLE = [0.82, 0.64, 0.9, 0.48, 0.7, 0.36];

export const dataVisualizationPage: GuidelinePage = {
  id: "data-visualization",
  section: "Color",
  title: "Data Visualization",
  description: "Chart colors: a categorical palette checked for color blindness, and sequential and diverging ramps.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const r = Math.min(brand.radius, 16);
    const colW = (CONTENT_WIDTH - 60) / 2;
    const series = categoricalColors(ctx);
    const separation = seriesSeparation(series);
    const ok = separation >= MIN_SERIES_DISTANCE;

    // Sample chart: one bar per series, with the series name under it.
    const chartY = CONTENT_TOP + 24;
    const chartH = 250;
    const slot = (colW - 48) / series.length;
    const bars = series
      .map((color, i) => {
        const h = (chartH - 70) * (SAMPLE[i] ?? 0.5);
        const x = MARGIN + 24 + i * slot + slot * 0.15;
        const baseline = chartY + chartH - 40;
        return `<rect x="${x}" y="${baseline - h}" width="${slot * 0.7}" height="${h}" rx="${Math.min(r, 6)}" fill="${color.hex}"/>
          ${text(x + slot * 0.35, baseline + 22, String(i + 1), { size: 14, fill: surface.muted, font: "bb", anchor: "middle" })}`;
      })
      .join("");
    const legend = series
      .map((color, i) => {
        const x = MARGIN + (i % 3) * (colW / 3);
        const y = chartY + chartH + 40 + Math.floor(i / 3) * 34;
        return `<rect x="${x}" y="${y - 14}" width="18" height="18" rx="5" fill="${color.hex}"/>
          ${text(x + 28, y, truncate(ctx, `${i + 1}  ${color.hex.toUpperCase()}`, colW / 3 - 40, 15, "bb"), { size: 15, fill: surface.text, font: "bb" })}`;
      })
      .join("");

    // Ramps: sequential and diverging, each a strip of equal steps.
    const rx = MARGIN + colW + 60;
    const strip = (colors: string[], y: number) => {
      const w = colW / colors.length;
      return `<clipPath id="dv-${y}"><rect x="${rx}" y="${y}" width="${colW}" height="64" rx="${r}"/></clipPath>
        <g clip-path="url(#dv-${y})">${colors.map((hex, i) => `<rect x="${rx + i * w}" y="${y}" width="${w + 0.5}" height="64" fill="${hex}"/>`).join("")}</g>
        <rect x="${rx}" y="${y}" width="${colW}" height="64" rx="${r}" fill="none" stroke="${surface.border}"/>`;
    };
    const sequentialY = chartY + 34;
    const divergingY = sequentialY + 64 + 96;
    const ramps = `${caption(ctx, rx, chartY, "Sequential: one measure, low to high")}
      ${strip(sequentialRamp(ctx), sequentialY)}
      ${caption(ctx, rx, sequentialY + 64 + 56, "Diverging: above and below a midpoint")}
      ${strip(divergingRamp(ctx), divergingY)}`;

    const verdict = ok
      ? "Every pair stays distinct under protanopia, deuteranopia and tritanopia."
      : "Some pairs are close under color blindness. Add labels or patterns.";
    const body = `${caption(ctx, MARGIN, chartY - 12, "Categorical: separate series")}
      ${card(ctx, MARGIN, chartY, colW, chartH)}
      ${bars}
      ${legend}
      ${ramps}
      ${paragraph(ctx, `${verdict} Smallest difference between any two series: ΔE ${separation.toFixed(2)} (at least ${MIN_SERIES_DISTANCE.toFixed(2)} needed).`, rx, CONTENT_BOTTOM - 96, colW, 17, surface.muted, 3)}
      ${paragraph(ctx, "Use the categorical colors in order, never more than six series in one chart, and label directly where you can. Use one ramp per measure and keep the same ramp across a report.", rx, divergingY + 64 + 36, colW, 17, surface.text, 3)}`;
    return guidelinePage(
      ctx,
      number,
      {
        section: "Data Visualization",
        title: "Data Visualization",
        lead: "Colors for charts that read the same for everyone: six series colors and two ramps built from the brand.",
      },
      body,
    );
  },
};
