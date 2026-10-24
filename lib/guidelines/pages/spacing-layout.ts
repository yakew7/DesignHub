import { caption, card, CONTENT_BOTTOM, CONTENT_TOP, CONTENT_WIDTH, guidelinePage, MARGIN } from "@/lib/guidelines/kit";
import type { GuidelinePage } from "@/lib/guidelines/types";
import { text } from "@/lib/mockups/kit";
import { radiusScale, spacingScale } from "@/lib/tokens/build";

export const GRID_COLUMNS = 12;
/** A column never gets narrower than this, so a huge spacing base cannot collapse the grid. */
const MIN_COLUMN = 8;

export type GridColumn = { x: number; width: number };

/** The gutter that still leaves every column at least MIN_COLUMN wide. */
export function fitGutter(width: number, gutter: number, columns = GRID_COLUMNS): number {
  const max = Math.max(0, (width - columns * MIN_COLUMN) / (columns - 1));
  return Math.min(gutter, max);
}

/** Column positions for a grid of `columns` equal columns separated by `gutter`, starting at x = 0. */
export function gridColumns(width: number, gutter: number, columns = GRID_COLUMNS): GridColumn[] {
  const gap = fitGutter(width, gutter, columns);
  const column = (width - gap * (columns - 1)) / columns;
  return Array.from({ length: columns }, (_, i) => ({ x: i * (column + gap), width: column }));
}

const px = (value: number) => `${Math.round(value * 100) / 100}px`;

export const spacingLayoutPage: GuidelinePage = {
  id: "spacing-layout",
  section: "UI",
  title: "Spacing & Layout",
  description: "The spacing scale, the radius scale and a 12-column grid, from the brand tokens.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const colW = (CONTENT_WIDTH - 60) / 2;
    const rx = MARGIN + colW + 60;

    // Spacing: one bar per step, drawn at its real width (scaled down only when the scale would not fit).
    const steps = spacingScale(brand.spacing).filter((step) => step.px > 0);
    const labelW = 190;
    const maxBar = colW - labelW - 8;
    const largest = Math.max(...steps.map((step) => step.px), 1);
    const scale = Math.min(1, maxBar / largest);
    const rowH = Math.min(48, (CONTENT_BOTTOM - CONTENT_TOP - 40) / Math.max(steps.length, 1));
    const spacing = steps
      .map((step, i) => {
        const y = CONTENT_TOP + 28 + i * rowH;
        const mid = y + rowH / 2;
        return `${text(MARGIN, mid + 5, `spacing-${step.name}`, { size: 14, fill: surface.text, font: "bb" })}
          ${text(MARGIN + labelW - 16, mid + 5, px(step.px), { size: 13, fill: surface.muted, anchor: "end" })}
          <rect x="${MARGIN + labelW}" y="${mid - 10}" width="${Math.max(step.px * scale, 1)}" height="20" rx="3" fill="${surface.primary}"/>`;
      })
      .join("");
    const note = scale < 1 ? "Bars are scaled down to fit" : `Base unit ${px(brand.spacing)}`;

    // Radius: a square per step with that corner radius.
    const radii = radiusScale(brand.radius);
    const tile = 76;
    const gap = (colW - tile * radii.length) / (radii.length - 1);
    const radius = radii
      .map((step, i) => {
        const x = rx + i * (tile + gap);
        const y = CONTENT_TOP + 28;
        const r = Math.min(step.px, tile / 2);
        return `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${r}" fill="${surface.primary}" fill-opacity=".14" stroke="${surface.primary}" stroke-width="2"/>
          ${text(x + tile / 2, y + tile + 24, step.name, { size: 14, fill: surface.text, font: "bb", anchor: "middle" })}
          ${text(x + tile / 2, y + tile + 44, px(step.px), { size: 13, fill: surface.muted, anchor: "middle" })}`;
      })
      .join("");

    // Grid: 12 columns with the spacing-6 gutter and a spacing-4 outer margin, at true size when it fits.
    const gridTop = CONTENT_TOP + 28 + tile + 44 + 56;
    const frameH = CONTENT_BOTTOM - gridTop - 24;
    const frameMargin = Math.min(brand.spacing * 2, colW / 8);
    const inner = colW - frameMargin * 2;
    const gutter = fitGutter(inner, brand.spacing * 3);
    const columns = gridColumns(inner, brand.spacing * 3);
    const colTop = gridTop + 16;
    const colH = frameH - 32;
    const gridColumnsMarkup = columns
      .map(
        (c) =>
          `<rect x="${rx + frameMargin + c.x}" y="${colTop}" width="${c.width}" height="${colH}" fill="${surface.primary}" fill-opacity=".14"/>`,
      )
      .join("");
    const span = (from: number, count: number, y: number, h: number, label: string) => {
      const first = columns[from];
      const last = columns[from + count - 1];
      if (!first || !last) return "";
      const x = rx + frameMargin + first.x;
      const w = last.x + last.width - first.x;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(brand.radius, 12)}" fill="${surface.primary}"/>
        ${text(x + w / 2, y + h / 2 + 5, label, { size: 14, fill: surface.background, font: "bb", anchor: "middle" })}`;
    };
    const blocks = `${span(0, 12, colTop + 16, 56, "12 columns")}
      ${span(0, 8, colTop + 16 + 56 + Math.max(gutter, 12), 120, "8 columns")}
      ${span(8, 4, colTop + 16 + 56 + Math.max(gutter, 12), 120, "4 columns")}`;
    const gridNote = `${GRID_COLUMNS} columns, gutter ${px(gutter)} (spacing-6), margin ${px(frameMargin)} (spacing-4)`;

    const markup = `${caption(ctx, MARGIN, CONTENT_TOP, "Spacing scale")}
      ${spacing}
      ${text(MARGIN, CONTENT_BOTTOM + 6, note, { size: 13, fill: surface.muted })}
      ${caption(ctx, rx, CONTENT_TOP, "Radius scale")}
      ${radius}
      ${caption(ctx, rx, gridTop - 14, "12-column grid")}
      ${card(ctx, rx, gridTop, colW, frameH)}
      ${gridColumnsMarkup}
      ${blocks}
      ${text(rx, CONTENT_BOTTOM + 6, gridNote, { size: 13, fill: surface.muted })}`;

    return guidelinePage(
      ctx,
      number,
      {
        section: "Layout",
        title: "Spacing and layout",
        lead: "Spacing, corner radius and grid values come from the brand tokens.",
      },
      markup,
    );
  },
};
