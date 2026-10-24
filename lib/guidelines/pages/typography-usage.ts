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
import { escapeXml, text, textWidth, truncate, wrap } from "@/lib/mockups/kit";
import { recommendedLineHeight } from "@/lib/typography/scale";
import type { TypeScaleStep } from "@/types/typography";

export type HierarchyLevel = {
  role: string;
  font: "h" | "b";
  step: TypeScaleStep;
  /** Recommended leading for the desktop size. */
  lineHeight: number;
};

/** Comfortable measure for body copy (characters per line). */
export const MEASURE = { min: 45, ideal: 66, max: 75 };
/** WCAG 1.4.12 asks paragraphs to survive 1.5; the guide never recommends less. */
export const BODY_MIN_LINE_HEIGHT = 1.5;

const SAMPLE =
  "Good typography goes unnoticed. Keep body lines between 45 and 75 characters so the eye finds the next line easily, and give paragraphs room with a line height of at least 1.5. Headings sit tighter, because large text needs less space between its lines.";

/**
 * Heading and body levels taken from the live type scale. Headings take the largest steps
 * (a Display level only when the scale has four or more steps above the base), Body takes the
 * base step and Small the step below it.
 */
export function typeHierarchy(scale: TypeScaleStep[]): HierarchyLevel[] {
  const level = (role: string, font: "h" | "b", step: TypeScaleStep): HierarchyLevel => {
    const leading = recommendedLineHeight(step.maxPx);
    return { role, font, step, lineHeight: font === "b" ? Math.max(BODY_MIN_LINE_HEIGHT, leading) : leading };
  };
  const up = scale.filter((step) => step.step > 0).sort((a, b) => b.step - a.step);
  const down = scale.filter((step) => step.step <= 0).sort((a, b) => b.step - a.step);
  const headingRoles =
    up.length >= 4 ? ["Display", "Heading 1", "Heading 2", "Heading 3"] : ["Heading 1", "Heading 2", "Heading 3"];
  const headings = up.slice(0, headingRoles.length).map((step, i) => level(headingRoles[i] ?? "Heading", "h", step));
  const body = down.slice(0, 2).map((step, i) => level(i === 0 ? "Body" : "Small", "b", step));
  return [...headings, ...body];
}

/** Breaks copy into lines of at most `chars` characters, at spaces, the way a measure is set in CSS (`ch`). */
export function wrapToMeasure(value: string, chars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > chars) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function dontTile(ctx: GuidelineContext, x: number, y: number, w: number, h: number, label: string, art: string) {
  const { surface } = ctx;
  const r = Math.min(ctx.brand.radius, 16);
  return `${card(ctx, x, y, w, h)}
    ${art}
    <rect x="${x}" y="${y + h - 56}" width="${w}" height="56" rx="${r}" fill="${surface.background}" fill-opacity=".92"/>
    ${checkIcon(x + 34, y + h - 28, BAD, false)}
    ${text(x + 60, y + h - 21, label, { size: 18, fill: surface.text })}`;
}

const px = (value: number) => `${Math.round(value)}px`;

export const typographyUsagePage: GuidelinePage = {
  id: "typography-usage",
  section: "Type",
  title: "Typography Usage",
  description: "Heading and body hierarchy, line length, line height and what to avoid.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const t = brand.typography;
    const colW = (CONTENT_WIDTH - 60) / 2;
    const dontH = 220;
    const dy = CONTENT_BOTTOM - dontH;

    // Hierarchy: each level drawn at its desktop size (capped to fit), with mobile to desktop size and leading.
    const levels = typeHierarchy(t.scale);
    const labelW = 150;
    const sampleW = colW - labelW;
    const room = dy - 40 - (CONTENT_TOP + 28);
    const rowHeight = (size: number) => Math.max(size * 1.25 + 18, 52);
    const natural = levels.reduce((sum, level) => sum + rowHeight(Math.min(level.step.maxPx, 64)), 0);
    const fit = Math.min(1, room / Math.max(natural, 1));
    let y = CONTENT_TOP + 28;
    const hierarchy = levels
      .map((level) => {
        const size = Math.round(Math.min(level.step.maxPx, 64) * fit * 10) / 10;
        const rowH = rowHeight(size);
        const baseline = y + rowH - 16;
        y += rowH;
        const sample = level.font === "h" ? brand.name : brand.description || brand.name;
        const value = truncate(ctx, sample, sampleW, size, level.font);
        const sizes =
          Math.round(level.step.minPx) === Math.round(level.step.maxPx)
            ? px(level.step.maxPx)
            : `${Math.round(level.step.minPx)}-${px(level.step.maxPx)}`;
        return `${text(MARGIN, baseline - 18, `${level.role} (${level.step.name})`, { size: 14, fill: surface.primaryText, font: "bb" })}
          ${text(MARGIN, baseline, `${sizes} / ${level.lineHeight}`, { size: 13, fill: surface.muted })}
          <text class="${level.font}" x="${MARGIN + labelW}" y="${baseline}" font-size="${size}" fill="${surface.text}">${escapeXml(value)}</text>
          <rect x="${MARGIN}" y="${baseline + 12}" width="${colW}" height="1" fill="${surface.border}"/>`;
      })
      .join("");

    // Line length and line height: body copy at the scale's body size, wrapped to the ideal measure.
    const body = levels.find((level) => level.role === "Body") ?? levels[levels.length - 1];
    const bodySize = Math.min(Math.max(body?.step.maxPx ?? 16, 14), 22);
    const leading = Math.max(BODY_MIN_LINE_HEIGHT, recommendedLineHeight(bodySize));
    const rx = MARGIN + colW + 60;
    const bodyLines = wrapToMeasure(SAMPLE, MEASURE.ideal);
    const measure = Math.min(Math.max(...bodyLines.map((line) => textWidth(ctx, line, bodySize))), colW - 50);
    const lineGap = bodySize * leading;
    const rulerY = CONTENT_TOP + 40;
    const firstBaseline = rulerY + 26 + bodySize;
    const paragraph = bodyLines
      .map(
        (line, i) =>
          `<text class="b" x="${rx + 50}" y="${firstBaseline + i * lineGap}" font-size="${bodySize}" fill="${surface.text}">${escapeXml(line)}</text>`,
      )
      .join("");
    const ruler = `<path d="M${rx + 50} ${rulerY - 6} v12 M${rx + 50} ${rulerY} H${rx + 50 + measure} M${rx + 50 + measure} ${rulerY - 6} v12" stroke="${surface.primary}" stroke-width="2" fill="none"/>
      ${text(rx + 50 + measure / 2, rulerY - 12, `About ${MEASURE.ideal} characters`, { size: 13, fill: surface.primaryText, font: "bb", anchor: "middle" })}`;
    const bracketTop = firstBaseline - bodySize * 0.8;
    const bracket = `<path d="M${rx + 26} ${bracketTop} h8 M${rx + 30} ${bracketTop} v${lineGap} M${rx + 26} ${bracketTop + lineGap} h8" stroke="${surface.primary}" stroke-width="2" fill="none"/>
      ${text(rx + 14, bracketTop + lineGap / 2 + 5, String(leading), { size: 13, fill: surface.primaryText, font: "bb", anchor: "end" })}`;
    const rulesY = firstBaseline + (bodyLines.length - 1) * lineGap + 50;
    const headingLeads = levels.filter((level) => level.font === "h").map((level) => level.lineHeight);
    const headingRange = headingLeads.length
      ? `${Math.min(...headingLeads)}-${Math.max(...headingLeads)}`
      : String(recommendedLineHeight(32));
    const rules = [
      `Line length: ${MEASURE.min}-${MEASURE.max} characters for body copy, ${MEASURE.ideal} is ideal`,
      `Body line height: ${leading}, never below ${BODY_MIN_LINE_HEIGHT}`,
      `Heading line height: ${headingRange}, tighter as the size grows`,
    ]
      .map((rule, i) => text(rx, rulesY + i * 30, rule, { size: 16, fill: surface.text }))
      .join("");

    // Don'ts: a mix of weights in one line, and body copy in all caps.
    const artH = dontH - 56;
    // Only regular, semibold and the heading weight are embedded in exports; heavier ones are synthesized.
    // One <text> with a <tspan> per word, so the browser spaces the words in whatever weight it draws.
    const mixed: [string, "b" | "bb" | "h", number?][] = [
      ["Too", "b"],
      ["many", "h"],
      ["weights", "bb"],
      ["in", "b", 300],
      ["one", "b", 900],
      ["line", "bb"],
    ];
    const tspans = mixed
      .map(
        ([word, cls, weight]) =>
          `<tspan class="${cls}"${weight ? ` style="font-weight:${weight}"` : ""}>${word}</tspan>`,
      )
      .join(" ");
    const mixedArt = `<text x="${MARGIN + 32}" y="${dy + artH / 2 + 12}" font-size="30" fill="${surface.text}" xml:space="preserve">${tspans}</text>`;
    const capsSize = Math.min(bodySize, 16);
    const capsLines = wrap(ctx, SAMPLE.toUpperCase(), colW - 64, capsSize, "b", 4);
    const capsArt = capsLines
      .map(
        (line, i) =>
          `<text class="b" x="${rx + 32}" y="${dy + 36 + capsSize + i * capsSize * leading}" font-size="${capsSize}" fill="${surface.text}">${escapeXml(line)}</text>`,
      )
      .join("");

    const markup = `${caption(ctx, MARGIN, CONTENT_TOP, "Hierarchy")}
      ${hierarchy}
      ${caption(ctx, rx, CONTENT_TOP, "Line length and line height")}
      ${ruler}${bracket}${paragraph}${rules}
      ${dontTile(ctx, MARGIN, dy, colW, dontH, "Don't mix many weights; use regular and one bold", mixedArt)}
      ${dontTile(ctx, rx, dy, colW, dontH, "Don't set body text in all caps", capsArt)}`;

    return guidelinePage(
      ctx,
      number,
      {
        section: "Typography",
        title: "Typography usage",
        lead: "How the type scale maps to headings and body copy.",
      },
      markup,
    );
  },
};
