import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1920;
const H = 384;
// The community icon overlaps the lower left corner, so the copy starts to its right.
const SAFE = { x: 300, y: 40, width: W - 300 - 60, height: H - 80 };

export const redditBanner: SocialTemplate = {
  id: "reddit-banner",
  platform: "Reddit",
  label: "Community banner",
  width: W,
  height: H,
  description: "Community banner, 1920 × 384 (5:1). The community icon covers the lower left.",
  safe: SAFE,
  covered: [{ x: 40, y: 224, width: 200, height: 160 }],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const x = SAFE.x + 40;
    const mark = 180;
    const markX = SAFE.x + SAFE.width - 40 - mark;
    const maxWidth = markX - 80 - x;
    const name = heading(ctx, content.name, x, 168, maxWidth, 72, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 28, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    // Measured in the regular weight, so leave room for the bold one.
    const footer = wrap(ctx, links, maxWidth * 0.92, 22, "b", 1)[0] ?? "";
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${name.markup}
      ${text(x, 222, tagline, { size: 28, fill: on, opacity: 0.85 })}
      ${text(x, 288, footer, { size: 22, fill: onColor ? on : surface.primaryText, font: "bb", opacity: onColor ? 0.9 : 1 })}
      ${logo(ctx, { x: markX, y: (H - mark) / 2, width: mark, height: mark }, onColor ? on : undefined, "reddit-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
