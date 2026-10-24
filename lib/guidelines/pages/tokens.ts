import { toHex } from "@/lib/color/color";
import { caption, CONTENT_BOTTOM, CONTENT_TOP, CONTENT_WIDTH, guidelinePage, MARGIN } from "@/lib/guidelines/kit";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { text } from "@/lib/mockups/kit";
import { flatten, variable, type FlatToken } from "@/lib/tokens/formats";

const ROW = 26;

/** Lays tokens out in columns, top to bottom, with a group caption at each group change. */
function tokenColumns(ctx: GuidelineContext, list: (FlatToken & { swatch?: string })[], columns: number): string {
  const { surface } = ctx;
  const gap = 32;
  const colW = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const rowsPerColumn = Math.floor((CONTENT_BOTTOM - CONTENT_TOP - 20) / ROW);
  const out: string[] = [];
  let col = 0;
  let row = 0;
  let group = "";
  let shown = 0;
  for (const token of list) {
    const needsCaption = token.group !== group;
    if (row + (needsCaption ? 2 : 1) > rowsPerColumn) {
      col += 1;
      row = 0;
      if (col >= columns) break;
    }
    const x = MARGIN + col * (colW + gap);
    if (needsCaption || row === 0) {
      group = token.group;
      out.push(caption(ctx, x, CONTENT_TOP + row * ROW + 14, group));
      row += 1;
    }
    const y = CONTENT_TOP + row * ROW + 16;
    const name = variable(ctx.tokens, token.name);
    const valueX = x + colW;
    const maxValue = Math.floor((colW * 0.42) / 7.2);
    const value = token.value.length > maxValue ? `${token.value.slice(0, maxValue - 3)}...` : token.value;
    out.push(
      token.swatch
        ? `<rect x="${x}" y="${y - 13}" width="16" height="16" rx="4" fill="${token.swatch}" stroke="${surface.border}"/>`
        : "",
      text(token.swatch ? x + 26 : x, y, name, { size: 13, fill: surface.text, font: "bb" }),
      text(valueX, y, value, { size: 13, fill: surface.muted, anchor: "end" }),
    );
    row += 1;
    shown += 1;
  }
  const rest = list.length - shown;
  if (rest > 0) {
    out.push(
      text(MARGIN + CONTENT_WIDTH, CONTENT_BOTTOM + 6, `and ${rest} more in the Export Engine`, {
        size: 13,
        fill: surface.muted,
        anchor: "end",
      }),
    );
  }
  return out.join("");
}

export const colorTokensPage: GuidelinePage = {
  id: "tokens-color",
  section: "Tokens",
  title: "Tokens: Color",
  description: "Appendix: every color token with its CSS variable.",
  render(ctx, number) {
    const all = flatten(ctx.tokens).filter((token) => token.group === "color" || token.group === "semantic");
    const swatches = new Map<string, string>();
    ctx.tokens.colors.forEach((color) => {
      swatches.set(`color-${color.name}`, toHex(color.value));
      color.shades.forEach((shade) => swatches.set(`color-${color.name}-${shade.step}`, toHex(shade.value)));
    });
    ctx.tokens.semantic.forEach((role) => swatches.set(`color-${role.name}`, toHex(role.value)));
    // Hex reads best in print; the Export Engine emits the configured color format.
    const list = all.map((token) => {
      const swatch = swatches.get(token.name);
      return { ...token, value: swatch ? swatch.toUpperCase() : token.value, swatch };
    });
    return guidelinePage(
      ctx,
      number,
      { section: "Appendix", title: "Design tokens: color" },
      tokenColumns(ctx, list, 4),
    );
  },
};

export const scaleTokensPage: GuidelinePage = {
  id: "tokens-scale",
  section: "Tokens",
  title: "Tokens: Type & Scale",
  description: "Appendix: fonts, type scale, spacing, radius and effects.",
  render(ctx, number) {
    const list = flatten(ctx.tokens).filter((token) => token.group !== "color" && token.group !== "semantic");
    return guidelinePage(
      ctx,
      number,
      { section: "Appendix", title: "Design tokens: type and scale" },
      tokenColumns(ctx, list, 3),
    );
  },
};
