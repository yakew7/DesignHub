import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 808;
const H = 632;
// Behance overlays the project title along the bottom on hover, so the bottom 120 px stay clear.
const COVERED = 120;
const SAFE = { x: 48, y: 40, width: W - 96, height: H - COVERED - 40 - 24 };

export const behanceCover: SocialTemplate = {
  id: "behance-cover",
  platform: "Behance",
  label: "Project cover",
  width: W,
  height: H,
  description: "Project cover, 808 × 632. The title overlay covers the bottom 120 px on hover.",
  safe: SAFE,
  covered: [{ x: 0, y: H - COVERED, width: W, height: COVERED }],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cx = W / 2;
    const mark = 96;
    const maxWidth = SAFE.width - 80;
    const name = heading(ctx, content.name, cx, 282, maxWidth, 60, on, { maxLines: 1, anchor: "middle" });
    const tagline = wrap(ctx, content.headline, maxWidth, 24, "b", 2);
    const taglineY = name.bottom + 50;
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 18, "bb");
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: cx - mark / 2, y: 92, width: mark, height: mark }, onColor ? on : undefined, "behance-mark")}
      ${name.markup}
      ${tagline
        .map((line, i) =>
          text(cx, taglineY + i * 34, line, {
            size: 24,
            fill: onColor ? on : surface.muted,
            anchor: "middle",
            opacity: onColor ? 0.88 : 1,
          }),
        )
        .join("")}
      ${text(cx, 446, footer, { size: 18, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle", opacity: onColor ? 0.9 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
