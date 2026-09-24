import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { gradientBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1000;
const H = 1500;
const VISUAL = 800;

export const pinterestPin: SocialTemplate = {
  id: "pinterest-pin",
  platform: "Pinterest",
  label: "Pin",
  width: W,
  height: H,
  description: "Standard pin, 1000 × 1500 (2:3). The save button and profile overlay cover the bottom 100 px.",
  safe: { x: 60, y: 60, width: W - 120, height: H - 180 },
  covered: [{ x: 0, y: 1400, width: W, height: 100 }],
  render(ctx) {
    const { surface, content } = ctx;
    const on = onPrimaryLarge(ctx);
    const pad = 80;
    const title = heading(ctx, content.headline, pad, VISUAL + 130, W - pad * 2, 68, surface.text, { maxLines: 3 });
    const subtitle = wrap(ctx, content.subtitle, W - pad * 2, 32, "b", 2);
    const subtitleY = title.bottom + 74;
    const site = pill(ctx, pad, 1268, content.website, 28, { fill: surface.primary, text: on });
    const body = `<rect width="${W}" height="${H}" fill="${surface.background}"/>
      <svg x="0" y="0" width="${W}" height="${VISUAL}" viewBox="0 0 ${W} ${VISUAL}">${gradientBackdrop(ctx, W, VISUAL)}</svg>
      ${logo(ctx, { x: W / 2 - 130, y: 210, width: 260, height: 260 }, on, "pin-mark")}
      ${text(W / 2, 560, ctx.brand.name.toUpperCase(), { size: 34, fill: on, font: "bb", anchor: "middle", spacing: 9, opacity: 0.9 })}
      ${title.markup}
      ${subtitle.map((line, i) => text(pad, subtitleY + i * 44, line, { size: 32, fill: surface.muted })).join("")}
      ${site.markup}`;
    return mockupDoc(ctx, W, H, body);
  },
};
