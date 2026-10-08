import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { backdrop, heading, meshBackdrop } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 960;
const H = 540;

export const discordBanner: SocialTemplate = {
  id: "discord-banner",
  platform: "Discord",
  label: "Server banner",
  width: W,
  height: H,
  description: "Server banner, 960 × 540 (16:9). The server name bar covers the bottom.",
  safe: { x: 40, y: 40, width: 880, height: 400 },
  covered: [{ x: 0, y: 440, width: 960, height: 100 }],
  render(ctx) {
    const { content, surface } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const title = heading(ctx, content.headline, 64, 230, W - 128, 52, on, { maxLines: 2 });
    const body = `${backdrop(ctx, W, H, () => meshBackdrop(ctx, W, H, "#0b0b16"))}
      ${logo(ctx, { x: 64, y: 64, width: 64, height: 64 }, on, "discord-mark")}
      ${text(148, 108, truncate(ctx, content.name, W - 64 - 148, 30, "h"), { size: 30, fill: on, font: "h" })}
      ${title.markup}
      ${text(64, title.bottom + 50, content.subtitle, { size: 22, fill: on, opacity: 0.85 })}
      ${text(64, 410, truncate(ctx, `${content.website}  ·  ${content.handle}`, W - 128, 20, "bb"), { size: 20, fill: on, font: "bb", opacity: 0.9 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
