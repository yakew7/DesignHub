import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 2560;
const H = 1440;
// TVs show the whole image and desktops a full-width strip, but phones only keep this centre.
const SAFE = { x: (W - 1546) / 2, y: 508, width: 1546, height: 423 };

export const youtubeBanner: SocialTemplate = {
  id: "youtube-banner",
  platform: "YouTube",
  label: "Channel banner",
  width: W,
  height: H,
  description: "Channel banner, 2560 × 1440. Devices crop it differently, so only the central 1546 × 423 always shows.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cy = SAFE.y + SAFE.height / 2;
    // The mark sits on a brand tile on the left of the safe area, the copy to its right.
    const tile = 240;
    const tileX = SAFE.x + 70;
    const tileY = cy - tile / 2;
    const radius = Math.min(ctx.brand.radius * 2, tile * 0.3);
    const x = tileX + tile + 72;
    const maxWidth = SAFE.x + SAFE.width - 70 - x;
    const name = heading(ctx, content.name, x, cy - 24, maxWidth, 100, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 38, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 30, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 80))}
      <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="${radius}" fill="${onColor ? on : surface.primary}" fill-opacity="${onColor ? 0.14 : 1}"/>
      ${logo(ctx, { x: tileX + 48, y: tileY + 48, width: tile - 96, height: tile - 96 }, onColor ? on : onPrimaryLarge(ctx), "yt-banner-mark")}
      ${name.markup}
      ${text(x, cy + 46, tagline, { size: 38, fill: onColor ? on : surface.muted, opacity: onColor ? 0.85 : 1 })}
      ${text(x, cy + 112, footer, { size: 30, fill: onColor ? on : surface.primaryText, font: "bb" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
