import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1200;
const H = 480;

export const twitchBanner: SocialTemplate = {
  id: "twitch-banner",
  platform: "Twitch",
  label: "Profile banner",
  width: W,
  height: H,
  description: "Profile banner, 1200 × 480 (5:2). Small screens crop the sides, so everything stays centred.",
  safe: { x: 150, y: 40, width: 900, height: 400 },
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const name = heading(ctx, content.name, W / 2, 252, 840, 64, on, { maxLines: 1, anchor: "middle" });
    const tagline = wrap(ctx, content.headline, 840, 28, "b", 2);
    const taglineY = name.bottom + 56;
    const footerY = taglineY + (tagline.length - 1) * 38 + 64;
    const footer = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 40))}
      ${logo(ctx, { x: W / 2 - 50, y: 80, width: 100, height: 100 }, onColor ? on : undefined, "twitch-mark")}
      ${name.markup}
      ${tagline
        .map((line, i) =>
          text(W / 2, taglineY + i * 38, line, {
            size: 28,
            fill: onColor ? on : surface.muted,
            anchor: "middle",
            opacity: onColor ? 0.85 : 1,
          }),
        )
        .join("")}
      ${text(W / 2, footerY, footer, { size: 22, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
