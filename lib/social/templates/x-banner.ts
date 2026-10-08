import { logo, mockupDoc, text, truncate } from "@/lib/mockups/kit";
import { glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1500;
const H = 500;

export const xBanner: SocialTemplate = {
  id: "x-banner",
  platform: "X",
  label: "Header",
  width: W,
  height: H,
  description: "Profile header, 1500 × 500. Mobile crops the top and bottom; the avatar covers the lower left.",
  safe: { x: 60, y: 60, width: W - 120, height: H - 120 },
  covered: [{ x: 40, y: 330, width: 340, height: 170 }],
  render(ctx) {
    const { surface, content } = ctx;
    const x = 520;
    const maxWidth = W - x - 340;
    const title = heading(ctx, content.headline, x, 210, maxWidth, 60, surface.text, { maxLines: 2 });
    const links = truncate(ctx, `${content.website}  ·  ${content.handle}`, maxWidth, 24, "bb");
    const body = `${glowBackdrop(ctx, W, H, 50)}
      ${title.markup}
      ${text(x, title.bottom + 56, content.subtitle, { size: 26, fill: surface.muted })}
      ${text(x, title.bottom + 106, links, { size: 24, fill: surface.primary, font: "bb" })}
      ${logo(ctx, { x: W - 290, y: H / 2 - 100, width: 200, height: 200 }, undefined, "x-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
