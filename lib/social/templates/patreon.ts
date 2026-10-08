import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1600;
const H = 400;
// Phones crop the sides, and the creator avatar is centred over the bottom edge.
const SAFE = { x: 160, y: 40, width: W - 320, height: H - 80 };
const AVATAR = { x: W / 2 - 110, y: 230, width: 220, height: H - 230 };

export const patreonCover: SocialTemplate = {
  id: "patreon-cover",
  platform: "Patreon",
  label: "Page cover",
  width: W,
  height: H,
  description: "Creator page cover, 1600 × 400 (4:1). The avatar covers the bottom centre and phones crop the sides.",
  safe: SAFE,
  covered: [AVATAR],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const accent = onColor ? on : surface.primaryText;
    const cx = W / 2;
    const maxWidth = SAFE.width - 160;
    const name = heading(ctx, content.name, cx, 150, maxWidth, 72, on, { maxLines: 1, anchor: "middle" });
    const tagline = wrap(ctx, content.headline, maxWidth, 28, "b", 1)[0] ?? "";
    // The bottom row runs either side of the avatar: mark and website on the left, handle on the right.
    const rowY = 322;
    const mark = 52;
    const left = SAFE.x + 40;
    const siteX = left + mark + 20;
    const site = truncate(ctx, content.website, AVATAR.x - 40 - siteX, 26, "bb");
    const handle = truncate(ctx, content.handle, SAFE.x + SAFE.width - 40 - (AVATAR.x + AVATAR.width + 40), 26, "bb");
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${name.markup}
      ${text(cx, 212, tagline, { size: 28, fill: on, anchor: "middle", opacity: 0.85 })}
      ${logo(ctx, { x: left, y: rowY - mark / 2 - 9, width: mark, height: mark }, onColor ? on : undefined, "patreon-mark")}
      ${text(siteX, rowY, site, { size: 26, fill: accent, font: "bb", opacity: onColor ? 0.92 : 1 })}
      ${text(SAFE.x + SAFE.width - 40, rowY, handle, { size: 26, fill: accent, font: "bb", anchor: "end", opacity: onColor ? 0.92 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
