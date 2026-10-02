import { text, wrap } from "@/lib/mockups/kit";
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

/** Shrinks a value title so a long word still fits inside its card. */
function fitTitle(ctx: GuidelineContext, value: string, width: number, size: number): number {
  const { heading, headingWeight } = ctx.brand.typography;
  const measured = ctx.measure(value, heading, headingWeight, size);
  return measured > width ? Math.max(18, Math.floor((size * width) / measured)) : size;
}

export const missionPage: GuidelinePage = {
  id: "mission",
  title: "Mission & Values",
  description: "Why the brand exists and the values behind every decision.",
  render(ctx, number) {
    const { surface, brand, mission } = ctx;

    const statementSize = 44;
    const statementLines = wrap(ctx, mission.statement, CONTENT_WIDTH - 60, statementSize, "h", 3);
    const statement = statementLines
      .map((line, i) =>
        text(MARGIN + 40, CONTENT_TOP + 78 + i * statementSize * 1.2, line, {
          size: statementSize,
          fill: surface.text,
          font: "h",
        }),
      )
      .join("");
    const barHeight = Math.max(1, statementLines.length) * statementSize * 1.2 + 6;
    const missionBlock = `${caption(ctx, MARGIN, CONTENT_TOP, "Our mission")}
      <rect x="${MARGIN}" y="${CONTENT_TOP + 30}" width="6" height="${barHeight}" rx="3" fill="${surface.primary}"/>
      ${statement}`;

    const values = mission.values.slice(0, 4);
    const valuesTop = CONTENT_TOP + 300;
    const gap = 24;
    const count = Math.max(1, values.length);
    const cw = (CONTENT_WIDTH - gap * (count - 1)) / count;
    const ch = CONTENT_BOTTOM - valuesTop - 50;
    const inner = cw - 64;
    const cards = values
      .map((value, i) => {
        const x = MARGIN + i * (cw + gap);
        const y = valuesTop + 40;
        const titleSize = fitTitle(ctx, value.title, inner, 36);
        return `${card(ctx, x, y, cw, ch)}
          ${text(x + 32, y + 50, String(i + 1).padStart(2, "0"), { size: 16, fill: surface.primaryText, font: "bb" })}
          ${text(x + 32, y + 110, value.title, { size: titleSize, fill: surface.text, font: "h" })}
          <rect x="${x + 32}" y="${y + 134}" width="40" height="3" rx="1.5" fill="${surface.primary}"/>
          ${paragraph(ctx, value.description, x + 32, y + 180, inner, 20, surface.muted, 4)}`;
      })
      .join("");
    const valuesBlock = values.length ? `${caption(ctx, MARGIN, valuesTop, "Our values")}${cards}` : "";

    return guidelinePage(
      ctx,
      number,
      { section: "Mission & Values", title: `What ${brand.name} stands for` },
      `${missionBlock}${valuesBlock}`,
    );
  },
};
