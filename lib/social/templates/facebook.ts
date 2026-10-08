import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1640;
const H = 624;

export const facebookCover: SocialTemplate = {
  id: "facebook-cover",
  platform: "Facebook",
  label: "Page cover",
  width: W,
  height: H,
  description: "Page cover, 1640 × 624. Mobile crops the sides, so everything stays centred.",
  safe: { x: 170, y: 40, width: 1300, height: 544 },
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const title = heading(ctx, content.headline, W / 2, 330, 1100, 64, on, { maxLines: 2, anchor: "middle" });
    const label = truncate(ctx, content.website, 1100 - 22 * 2.2, 22, "bb");
    const width = ctx.measure(label, ctx.brand.typography.body, 600, 22) + 22 * 2.2;
    const site = pill(ctx, (W - width) / 2, title.bottom + 90, label, 22, {
      fill: onColor ? on : surface.primary,
      text: onColor ? surface.primary : onPrimaryLarge(ctx),
    });
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: W / 2 - 48, y: 120, width: 96, height: 96 }, onColor ? on : undefined, "fb-mark")}
      ${title.markup}
      ${text(W / 2, title.bottom + 54, content.subtitle, { size: 26, fill: on, anchor: "middle", opacity: 0.85 })}
      ${site.markup}`;
    return mockupDoc(ctx, W, H, body);
  },
};
