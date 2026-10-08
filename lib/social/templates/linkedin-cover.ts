import { logo, mockupDoc, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { gradientBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1584;
const H = 396;

export const linkedinCover: SocialTemplate = {
  id: "linkedin-cover",
  platform: "LinkedIn",
  label: "Profile cover",
  width: W,
  height: H,
  description: "Personal profile background, 1584 × 396. The photo covers the lower left.",
  // Mobile crops the sides; the profile photo sits over the lower left on desktop.
  safe: { x: 190, y: 24, width: W - 380, height: H - 48 },
  covered: [{ x: 48, y: 212, width: 300, height: 184 }],
  render(ctx) {
    const { content, surface } = ctx;
    const on = onPrimaryLarge(ctx);
    const x = 560;
    const maxWidth = W - x - 424;
    const title = heading(ctx, content.headline, x, 150, maxWidth, 48, on, { maxLines: 2 });
    const site = pill(ctx, x, title.bottom + 76, content.website, 20, { fill: on, text: surface.primary }, maxWidth);
    const body = `${gradientBackdrop(ctx, W, H)}
      ${title.markup}
      ${text(x, title.bottom + 46, content.subtitle, { size: 24, fill: on, opacity: 0.85 })}
      ${site.markup}
      ${logo(ctx, { x: W - 380, y: H / 2 - 80, width: 160, height: 160 }, on, "li-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
