import { logo, mockupDoc, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1500;
const H = 500;

export const mastodonHeader: SocialTemplate = {
  id: "mastodon-header",
  platform: "Mastodon",
  label: "Profile header",
  width: W,
  height: H,
  description: "Profile header, 1500 × 500 (3:1). The avatar covers the lower left corner.",
  safe: { x: 60, y: 50, width: W - 120, height: H - 100 },
  covered: [{ x: 40, y: 300, width: 320, height: 200 }],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const x = 440;
    const title = heading(ctx, content.headline, x, 200, W - x - 420, 56, on, { maxLines: 2 });
    const site = pill(ctx, x, title.bottom + 70, content.website, 20, {
      fill: onColor ? on : surface.primary,
      text: onColor ? surface.primary : onPrimaryLarge(ctx),
    });
    // The mark sits on a translucent tile on the right, clear of the avatar.
    const tile = 240;
    const tileX = W - 120 - tile;
    const tileY = (H - tile) / 2;
    const radius = Math.min(ctx.brand.radius * 2, tile * 0.3);
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${text(x, 120, content.name.toUpperCase(), { size: 18, fill: on, font: "bb", spacing: 5, opacity: 0.85 })}
      ${title.markup}
      ${text(x, title.bottom + 46, content.subtitle, { size: 24, fill: on, opacity: 0.8 })}
      ${site.markup}
      ${text(x + site.width + 20, title.bottom + 102, content.handle, { size: 22, fill: on, font: "bb", opacity: 0.85 })}
      <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="${radius}" fill="${on}" fill-opacity=".1" stroke="${on}" stroke-opacity=".22" stroke-width="2"/>
      ${logo(ctx, { x: tileX + 44, y: tileY + 44, width: tile - 88, height: tile - 88 }, onColor ? on : undefined, "mastodon-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
