import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1920;
const H = 480;
// Kick scales the banner to the page width and crops it on smaller screens, so the copy keeps to the centre.
const SAFE = { x: 160, y: 40, width: 1600, height: 400 };

export const kickBanner: SocialTemplate = {
  id: "kick-banner",
  platform: "Kick",
  label: "Channel banner",
  width: W,
  height: H,
  description: "Channel banner, 1920 × 480 (4:1). Smaller screens crop it, so keep to the central 1600 × 400.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cy = H / 2;
    // The mark sits on a brand tile on the left of the safe area, the copy to its right.
    const tile = 220;
    const tileX = SAFE.x + 60;
    const tileY = cy - tile / 2;
    const radius = Math.min(ctx.brand.radius * 2, tile * 0.3);
    const x = tileX + tile + 64;
    const maxWidth = SAFE.x + SAFE.width - 60 - x;
    const name = heading(ctx, content.name, x, cy - 20, maxWidth, 88, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 34, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth - 40, 26, "bb");
    const accent = onColor ? on : surface.primary;
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 60))}
      <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="${radius}" fill="${onColor ? on : surface.primary}" fill-opacity="${onColor ? 0.14 : 1}"/>
      ${logo(ctx, { x: tileX + 44, y: tileY + 44, width: tile - 88, height: tile - 88 }, onColor ? on : onPrimaryLarge(ctx), "kick-mark")}
      ${name.markup}
      ${text(x, cy + 40, tagline, { size: 34, fill: onColor ? on : surface.muted, opacity: onColor ? 0.85 : 1 })}
      <rect x="${x}" y="${cy + 81}" width="24" height="6" rx="3" fill="${accent}"/>
      ${text(x + 40, cy + 94, footer, { size: 26, fill: onColor ? on : surface.primaryText, font: "bb" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
