import { logo, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import type { DrawContext } from "@/lib/mockups/types";

/** Brand surface with a faint grid and two soft glows in the primary and secondary colors. */
export function glowBackdrop(ctx: DrawContext, width: number, height: number, cell = 48): string {
  const { surface } = ctx;
  const blur = Math.round(Math.min(width, height) * 0.18);
  const lineOpacity = ctx.mode === "dark" ? 0.07 : 0.06;
  return `<defs>
      <pattern id="grid" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse"><path d="M${cell} 0H0V${cell}" fill="none" stroke="${surface.text}" stroke-opacity="${lineOpacity}" stroke-width="1"/></pattern>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter>
      <radialGradient id="fade" cx=".5" cy=".5" r=".75"><stop offset=".3" stop-color="${surface.background}" stop-opacity="0"/><stop offset="1" stop-color="${surface.background}"/></radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="${surface.background}"/>
    <rect width="${width}" height="${height}" fill="url(#grid)"/>
    <circle cx="${width * 0.82}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.42}" fill="${surface.primary}" fill-opacity="${ctx.mode === "dark" ? 0.55 : 0.35}" filter="url(#glow)"/>
    <circle cx="${width * 0.62}" cy="${height * 0.95}" r="${Math.min(width, height) * 0.34}" fill="${surface.secondary}" fill-opacity="${ctx.mode === "dark" ? 0.4 : 0.28}" filter="url(#glow)"/>
    <rect width="${width}" height="${height}" fill="url(#fade)"/>`;
}

/** Primary to secondary gradient with large translucent rings. */
export function gradientBackdrop(ctx: DrawContext, width: number, height: number): string {
  const { surface } = ctx;
  const on = onPrimaryLarge(ctx);
  const r = Math.max(width, height);
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="${width}" cy="0" r="${r * 0.42}" fill="none" stroke="${on}" stroke-opacity=".12" stroke-width="${r * 0.02}"/>
    <circle cx="${width}" cy="0" r="${r * 0.28}" fill="none" stroke="${on}" stroke-opacity=".12" stroke-width="${r * 0.02}"/>
    <circle cx="0" cy="${height}" r="${r * 0.22}" fill="${on}" fill-opacity=".07"/>`;
}

/** Logo plus brand name, vertically centred on `cy`. */
export function lockup(ctx: DrawContext, x: number, cy: number, size: number, color?: string, id = "lockup"): string {
  const fill = color ?? ctx.surface.text;
  return `${logo(ctx, { x, y: cy - size / 2, width: size, height: size }, color, id)}
    ${text(x + size * 1.3, cy + size * 0.3, ctx.brand.name, { size: size * 0.8, fill, font: "h" })}`;
}

/** Wrapped heading lines. Returns the markup and the baseline of the last line. */
export function heading(
  ctx: DrawContext,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  fill: string,
  options: { maxLines?: number; anchor?: "start" | "middle" | "end"; leading?: number } = {},
): { markup: string; bottom: number; lines: number } {
  const { maxLines = 3, anchor = "start", leading = 1.08 } = options;
  const rows = wrap(ctx, value, maxWidth, size, "h", maxLines);
  const markup = rows
    .map((line, i) => text(x, y + i * size * leading, line, { size, fill, font: "h", anchor }))
    .join("");
  return { markup, bottom: y + (rows.length - 1) * size * leading, lines: rows.length };
}

/** A rounded pill with centred label. */
export function pill(
  ctx: DrawContext,
  x: number,
  y: number,
  label: string,
  size: number,
  colors: { fill: string; text: string; stroke?: string },
): { markup: string; width: number } {
  const width = ctx.measure(label, ctx.brand.typography.body, 600, size) + size * 2.2;
  const height = size * 2.4;
  const markup = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${colors.fill}"${colors.stroke ? ` stroke="${colors.stroke}" stroke-width="${Math.max(1.5, size / 10)}"` : ""}/>
    ${text(x + width / 2, y + height / 2 + size * 0.36, label, { size, fill: colors.text, font: "bb", anchor: "middle" })}`;
  return { markup, width };
}

/** Bold mesh: overlapping blurred blobs of the brand colors on a deep base. */
export function meshBackdrop(ctx: DrawContext, width: number, height: number, baseColor?: string): string {
  const { surface } = ctx;
  const base = baseColor ?? (ctx.mode === "dark" ? "#07070b" : surface.background);
  const r = Math.max(width, height);
  const blur = Math.round(Math.min(width, height) * 0.16);
  const blob = (cx: number, cy: number, radius: number, color: string, opacity: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}" filter="url(#mesh-blur)"/>`;
  return `<defs><filter id="mesh-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
    <rect width="${width}" height="${height}" fill="${base}"/>
    ${blob(width * 0.12, height * 0.15, r * 0.34, surface.primary, 0.95)}
    ${blob(width * 0.85, height * 0.25, r * 0.3, surface.secondary, 0.9)}
    ${blob(width * 0.6, height * 1.05, r * 0.32, surface.primary, 0.75)}
    ${blob(width * 0.3, height * 0.95, r * 0.2, surface.secondary, 0.6)}`;
}

/** A flat brand background. */
export function solidBackdrop(ctx: DrawContext, width: number, height: number): string {
  return `<rect width="${width}" height="${height}" fill="${ctx.surface.background}"/>`;
}

/**
 * The template's own background, unless the user picked a background style in the
 * Content panel, in which case every template uses that one.
 */
export function backdrop(
  ctx: DrawContext & { layout?: { background: string } },
  width: number,
  height: number,
  own: () => string,
): string {
  switch (ctx.layout?.background) {
    case "solid":
      return solidBackdrop(ctx, width, height);
    case "gradient":
      return gradientBackdrop(ctx, width, height);
    case "glow":
      return glowBackdrop(ctx, width, height);
    case "mesh":
      return meshBackdrop(ctx, width, height);
    default:
      return own();
  }
}
