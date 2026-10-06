import { contrastRatio, oklch, parseColor } from "@/lib/color/color";
import { nestLogo, type Rect } from "@/lib/logo/compose";
import { monochromeSvg } from "@/lib/logo/recolor";
import type { DrawContext } from "@/lib/mockups/types";

export const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Standalone SVG with the brand fonts inlined and `.h` / `.b` classes for heading and body text. */
export function mockupDoc(ctx: DrawContext, width: number, height: number, body: string, defs = ""): string {
  const { heading, headingCategory, body: bodyFont, bodyCategory } = ctx.brand.typography;
  const fallback = (category: string) =>
    category === "serif"
      ? "Georgia, serif"
      : category === "monospace"
        ? "ui-monospace, monospace"
        : "ui-sans-serif, system-ui, sans-serif";
  const style = `${ctx.fontCss}
.h{font-family:'${heading}',${fallback(headingCategory)};font-weight:${ctx.brand.typography.headingWeight}}
.b{font-family:'${bodyFont}',${fallback(bodyCategory)};font-weight:400}
.bb{font-family:'${bodyFont}',${fallback(bodyCategory)};font-weight:600}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style><defs><filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity=".28"/></filter>${defs}</defs>${body}</svg>`;
}

type TextOptions = {
  size: number;
  fill: string;
  font?: "h" | "b" | "bb";
  anchor?: "start" | "middle" | "end";
  spacing?: number;
  opacity?: number;
};

export function text(x: number, y: number, value: string, options: TextOptions): string {
  const { size, fill, font = "b", anchor = "start", spacing = 0, opacity = 1 } = options;
  return `<text class="${font}" x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ""}${opacity < 1 ? ` fill-opacity="${opacity}"` : ""}>${escapeXml(value)}</text>`;
}

export function logo(ctx: DrawContext, rect: Rect, color?: string, id?: string): string {
  const svg = color ? monochromeSvg(ctx.brand.logo.svg, color) : ctx.brand.logo.svg;
  return nestLogo(svg, rect, id);
}

/** A soft studio backdrop behind printed mockups. */
export function desk(ctx: DrawContext, width: number, height: number): string {
  const top = ctx.mode === "light" ? "#e9e7e3" : "#15161a";
  const bottom = ctx.mode === "light" ? "#d8d5cf" : "#0b0c0f";
  return `<defs><linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#desk)"/>`;
}

export function rotate(degrees: number, cx: number, cy: number, body: string): string {
  return `<g transform="rotate(${degrees} ${cx} ${cy})">${body}</g>`;
}

/**
 * Color for large text and marks on the primary color. WCAG allows 3:1 for large
 * text and graphics, so white wins whenever it reaches that, which matches how
 * most brands print on their own color.
 */
export function onPrimaryLarge(ctx: DrawContext): string {
  const primary = parseColor(ctx.surface.primary);
  if (primary && contrastRatio(primary, oklch(1, 0, 0)) >= 3) return "#ffffff";
  return ctx.surface.onPrimary;
}

/** Greedy word wrap using real font metrics. */
export function wrap(
  ctx: DrawContext,
  value: string,
  maxWidth: number,
  size: number,
  font: "h" | "b" = "h",
  maxLines = 4,
): string[] {
  const family = font === "h" ? ctx.brand.typography.heading : ctx.brand.typography.body;
  const weight = font === "h" ? ctx.brand.typography.headingWeight : 400;
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measure(next, family, weight, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]}...`;
    return kept;
  }
  return lines;
}

/**
 * Shortens `value` with an ellipsis until it fits `maxWidth` on one line, even when it is a
 * single long word. `spacing` is the letter-spacing the text is drawn with.
 */
export function truncate(
  ctx: DrawContext,
  value: string,
  maxWidth: number,
  size: number,
  font: "h" | "b" | "bb" = "b",
  spacing = 0,
): string {
  const family = font === "h" ? ctx.brand.typography.heading : ctx.brand.typography.body;
  const weight = font === "h" ? ctx.brand.typography.headingWeight : font === "bb" ? 600 : 400;
  const measure = (s: string) => ctx.measure(s, family, weight, size) + spacing * s.length;
  if (measure(value) <= maxWidth) return value;
  let out = value;
  while (out.length > 1 && measure(`${out.trimEnd()}...`) > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}...`;
}

/** Placeholder paragraph lines, for body copy that only needs to read as text. */
export function lines(x: number, y: number, width: number, count: number, gap: number, fill: string): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    const w = i === count - 1 ? width * 0.62 : width * (0.9 + ((i * 37) % 10) / 100);
    out += `<rect x="${x}" y="${y + i * gap}" width="${Math.min(width, w).toFixed(0)}" height="${Math.round(gap * 0.36)}" rx="${Math.round(gap * 0.18)}" fill="${fill}"/>`;
  }
  return out;
}
