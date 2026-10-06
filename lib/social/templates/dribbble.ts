import { lines, logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialContext, SocialTemplate } from "@/lib/social/types";

const W = 1600;
const H = 1200;
// Dribbble shows the whole shot, but the grid thumbnails scale it down, so keep a wide margin.
const SAFE = { x: 80, y: 80, width: W - 160, height: H - 160 };

/** A small UI kit card: type sample, color swatches, buttons, an input and a card. */
function uiKit(ctx: SocialContext, x: number, y: number, width: number, height: number): string {
  const { surface, brand, content } = ctx;
  const r = Math.min(brand.radius, 24);
  const pad = 56;
  const ix = x + pad;
  const iw = width - pad * 2;

  const swatches = [
    { name: "Primary", color: surface.primary },
    { name: "Secondary", color: surface.secondary },
    { name: "Text", color: surface.text },
    { name: "Surface", color: surface.background },
  ];
  const gap = 40;
  const sw = (iw - gap * (swatches.length - 1)) / swatches.length;
  const swatchY = y + 250;
  const swatchRow = swatches
    .map((swatch, i) => {
      const sx = ix + i * (sw + gap);
      return `<rect x="${sx}" y="${swatchY}" width="${sw}" height="${sw}" rx="${Math.min(r, 20)}" fill="${swatch.color}" stroke="${surface.border}" stroke-width="2"/>
        ${text(sx, swatchY + sw + 36, swatch.name, { size: 20, fill: surface.text, font: "bb" })}
        ${text(sx, swatchY + sw + 64, truncate(ctx, swatch.color.toUpperCase(), sw, 17), { size: 17, fill: surface.muted })}`;
    })
    .join("");

  const buttonY = y + 520;
  const primary = pill(ctx, ix, buttonY, truncate(ctx, content.cta || "Get started", iw / 2 - 80, 22, "bb"), 22, {
    fill: surface.primary,
    text: onPrimaryLarge(ctx),
  });
  const outline = pill(ctx, ix + primary.width + 24, buttonY, "Learn more", 22, {
    fill: "none",
    text: surface.text,
    stroke: surface.border,
  });

  const inputY = y + 630;
  const toggleW = 96;
  const inputW = iw - toggleW - 32;
  const toggleX = ix + iw - toggleW;
  const input = `<rect x="${ix}" y="${inputY}" width="${inputW}" height="64" rx="${Math.min(r, 16)}" fill="${surface.background}" stroke="${surface.border}" stroke-width="2"/>
    ${text(ix + 24, inputY + 40, "Email address", { size: 20, fill: surface.muted })}
    <rect x="${toggleX}" y="${inputY + 8}" width="${toggleW}" height="48" rx="24" fill="${surface.primary}"/>
    <circle cx="${toggleX + toggleW - 24}" cy="${inputY + 32}" r="17" fill="${onPrimaryLarge(ctx)}"/>`;

  const cardY = y + 730;
  const cardH = height - (cardY - y) - pad;
  const card = `<rect x="${ix}" y="${cardY}" width="${iw}" height="${cardH}" rx="${r}" fill="${surface.background}" stroke="${surface.border}" stroke-width="2"/>
    <rect x="${ix + 28}" y="${cardY + (cardH - 64) / 2}" width="64" height="64" rx="${Math.min(r, 16)}" fill="${surface.primary}" fill-opacity=".14"/>
    ${logo(ctx, { x: ix + 40, y: cardY + (cardH - 40) / 2, width: 40, height: 40 }, undefined, "dribbble-card")}
    ${lines(ix + 120, cardY + cardH / 2 - 22, iw - 160, 2, 32, surface.border)}`;

  const { heading: headingFont, body: bodyFont } = brand.typography;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r + 8}" fill="${surface.surface}" stroke="${surface.border}" filter="url(#soft)"/>
    ${text(ix, y + 172, "Aa", { size: 140, fill: surface.text, font: "h" })}
    ${text(ix + 220, y + 112, truncate(ctx, headingFont, iw - 220, 24, "bb"), { size: 24, fill: surface.text, font: "bb" })}
    ${text(ix + 220, y + 150, truncate(ctx, `Body: ${bodyFont}`, iw - 220, 20), { size: 20, fill: surface.muted })}
    <rect x="${ix}" y="${y + 210}" width="${iw}" height="2" fill="${surface.border}"/>
    ${swatchRow}
    ${primary.markup}
    ${outline.markup}
    ${input}
    ${card}`;
}

export const dribbbleShot: SocialTemplate = {
  id: "dribbble-shot",
  platform: "Dribbble",
  label: "Shot",
  width: W,
  height: H,
  description: "Shot, 1600 × 1200 (4:3). A showcase of the logo, name and a UI kit sample.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const x = SAFE.x + 40;
    const kitX = 800;
    const kitY = 150;
    const maxWidth = kitX - 80 - x;
    const mark = 120;
    const name = heading(ctx, content.name, x, 480, maxWidth, 92, on, { maxLines: 2 });
    const tagline = wrap(ctx, content.headline, maxWidth, 34, "b", 3);
    const taglineY = name.bottom + 80;
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 26, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 64))}
      ${logo(ctx, { x, y: 230, width: mark, height: mark }, onColor ? on : undefined, "dribbble-mark")}
      ${name.markup}
      ${tagline
        .map((line, i) =>
          text(x, taglineY + i * 48, line, {
            size: 34,
            fill: onColor ? on : surface.muted,
            opacity: onColor ? 0.88 : 1,
          }),
        )
        .join("")}
      ${text(x, 1000, footer, { size: 26, fill: onColor ? on : surface.primaryText, font: "bb", opacity: onColor ? 0.9 : 1 })}
      ${uiKit(ctx, kitX, kitY, SAFE.x + SAFE.width - 40 - kitX, 900)}`;
    return mockupDoc(ctx, W, H, body);
  },
};
