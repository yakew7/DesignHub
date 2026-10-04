import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { backdrop, heading, meshBackdrop } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 3000;
const H = 1055;
// Phones crop the sides, and the blog avatar overlaps the bottom centre.
const SAFE = { x: 600, y: 100, width: 1800, height: 740 };

export const tumblrHeader: SocialTemplate = {
  id: "tumblr-header",
  platform: "Tumblr",
  label: "Blog header",
  width: W,
  height: H,
  description: "Blog header, 3000 × 1055. Phones crop the sides and the avatar covers the bottom centre.",
  safe: SAFE,
  covered: [{ x: W / 2 - 130, y: 875, width: 260, height: 180 }],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cx = W / 2;
    const mark = 170;
    const maxWidth = SAFE.width - 160;
    const name = heading(ctx, content.name, cx, 500, maxWidth, 140, on, { maxLines: 1, anchor: "middle" });
    const tagline = wrap(ctx, content.headline, maxWidth, 52, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    // Measured in the regular weight, so leave room for the bold one.
    const footer = wrap(ctx, links, maxWidth * 0.92, 38, "b", 1)[0] ?? "";
    const body = `${backdrop(ctx, W, H, () => meshBackdrop(ctx, W, H, surface.primary))}
      ${logo(ctx, { x: cx - mark / 2, y: 180, width: mark, height: mark }, onColor ? on : undefined, "tumblr-mark")}
      ${name.markup}
      ${text(cx, 610, tagline, { size: 52, fill: on, anchor: "middle", opacity: 0.88 })}
      ${text(cx, 730, footer, { size: 38, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle", opacity: onColor ? 0.9 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
