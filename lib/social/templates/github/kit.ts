import { escapeXml, mockupDoc, text, wrap } from "@/lib/mockups/kit";
import type { SocialContext, SocialTemplate } from "@/lib/social/types";

export const W = 1280;
export const H = 640;

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/**
 * Defines one style of the GitHub repository banner. Every style shares the size, safe
 * area and picker group, and renders from the same SocialContext.
 */
export function githubBanner(
  style: string,
  description: string,
  render: (ctx: SocialContext) => { body: string; defs?: string },
): SocialTemplate {
  return {
    id: `github-${style.toLowerCase()}`,
    platform: "GitHub",
    group: "Repository banner",
    style,
    label: `Repository banner: ${style}`,
    width: W,
    height: H,
    description: `${description} Social preview and README header, 1280 × 640.`,
    safe: { x: 40, y: 40, width: W - 80, height: H - 80 },
    render: (ctx) => {
      const { body, defs } = render(ctx);
      return mockupDoc(ctx, W, H, body, defs);
    },
  };
}

/** Wrapped body copy in the body font. */
export function body(
  ctx: SocialContext,
  value: string,
  x: number,
  y: number,
  width: number,
  size: number,
  fill: string,
  options: { maxLines?: number; anchor?: "start" | "middle" | "end"; leading?: number; opacity?: number } = {},
): { markup: string; bottom: number } {
  const { maxLines = 2, anchor = "start", leading = 1.45, opacity = 1 } = options;
  const lines = wrap(ctx, value, width, size, "b", maxLines);
  const markup = lines
    .map((line, i) => text(x, y + i * size * leading, line, { size, fill, anchor, opacity }))
    .join("");
  return { markup, bottom: y + (lines.length - 1) * size * leading };
}

/** Monospace text (system mono font, which every OS ships). */
export function mono(
  x: number,
  y: number,
  value: string,
  options: { size: number; fill: string; weight?: number; anchor?: "start" | "middle" | "end"; opacity?: number },
): string {
  const { size, fill, weight = 400, anchor = "start", opacity = 1 } = options;
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ""}>${escapeXml(value)}</text>`;
}

/** A git branch glyph, drawn so no third-party logo is needed. */
export function branchIcon(x: number, y: number, size: number, color: string): string {
  const s = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${2 / Math.max(s, 0.5)}" stroke-linecap="round"><circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="7" r="2.5"/><path d="M6 7.5v9M18 9.5c0 5-6 4-11 7"/></g>`;
}

/** A five-point star glyph. */
export function starIcon(x: number, y: number, size: number, color: string): string {
  const s = size / 24;
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" fill="${color}"/>`;
}

/** "github.com/user" chip with a branch icon. Returns the markup and its width. */
export function githubChip(
  ctx: SocialContext,
  x: number,
  y: number,
  size: number,
  colors: { fill: string; text: string; stroke?: string },
): { markup: string; width: number } {
  const label = `github.com/${ctx.content.github}`;
  const height = size * 2.3;
  const icon = size * 1.1;
  const width = ctx.measure(label, ctx.brand.typography.body, 600, size) + size * 2 + icon + size * 0.5;
  const markup = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(ctx.brand.radius, height / 2)}" fill="${colors.fill}"${colors.stroke ? ` stroke="${colors.stroke}" stroke-width="1.5"` : ""}/>
    ${branchIcon(x + size, y + (height - icon) / 2, icon, colors.text)}
    ${text(x + size + icon + size * 0.5, y + height / 2 + size * 0.36, label, { size, fill: colors.text, font: "bb" })}`;
  return { markup, width };
}

/** Website pill in the primary color. */
export function websitePill(
  ctx: SocialContext,
  x: number,
  y: number,
  size: number,
  colors: { fill: string; text: string; stroke?: string },
): { markup: string; width: number } {
  const label = ctx.content.website;
  const height = size * 2.3;
  const width = ctx.measure(label, ctx.brand.typography.body, 600, size) + size * 2;
  const markup = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(ctx.brand.radius, height / 2)}" fill="${colors.fill}"${colors.stroke ? ` stroke="${colors.stroke}" stroke-width="1.5"` : ""}/>
    ${text(x + width / 2, y + height / 2 + size * 0.36, label, { size, fill: colors.text, font: "bb", anchor: "middle" })}`;
  return { markup, width };
}

/** Faint square grid. */
export function gridPattern(id: string, cell: number, color: string, opacity: number): string {
  return `<pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse"><path d="M${cell} 0H0V${cell}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1"/></pattern>`;
}

export const slugOf = (ctx: SocialContext) =>
  ctx.content.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "project";
