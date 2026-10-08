import { logo, mockupDoc, onPrimaryLarge, text, textWidth, truncate } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading, pill, share } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1500;
const H = 500;

export const blueskyBanner: SocialTemplate = {
  id: "bluesky-banner",
  platform: "Bluesky",
  label: "Profile banner",
  width: W,
  height: H,
  description: "Profile banner, 1500 × 500 (3:1). The avatar overlaps the lower left.",
  safe: { x: 60, y: 60, width: W - 120, height: H - 120 },
  covered: [{ x: 40, y: 330, width: 300, height: 170 }],
  render(ctx) {
    const { surface, content } = ctx;
    const x = 440;
    const maxWidth = W - x - 380;
    const title = heading(ctx, content.headline, x, 200, maxWidth, 56, surface.text, { maxLines: 2 });
    const colors = { fill: surface.primary, text: onPrimaryLarge(ctx) };
    // The website pill and the handle share one row, clear of the mark.
    const [siteMax, handleMax] = share(
      pill(ctx, x, 0, content.website, 20, colors).width,
      textWidth(ctx, content.handle, 22, "bb"),
      maxWidth - 20,
    );
    const site = pill(ctx, x, title.bottom + 70, content.website, 20, colors, siteMax);
    const handle = truncate(ctx, content.handle, Math.min(handleMax, maxWidth - 20 - site.width), 22, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 50))}
      ${text(x, 120, truncate(ctx, content.name.toUpperCase(), W - x - 80, 18, "bb", 5), { size: 18, fill: surface.primaryText, font: "bb", spacing: 5 })}
      ${title.markup}
      ${text(x, title.bottom + 46, content.subtitle, { size: 24, fill: surface.muted })}
      ${site.markup}
      ${text(x + site.width + 20, title.bottom + 102, handle, { size: 22, fill: surface.muted, font: "bb" })}
      ${logo(ctx, { x: W - 300, y: H / 2 - 110, width: 220, height: 220 }, undefined, "bsky-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
