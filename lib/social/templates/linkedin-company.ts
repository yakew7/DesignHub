import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1128;
const H = 191;

export const linkedinCompanyCover: SocialTemplate = {
  id: "linkedin-company",
  platform: "LinkedIn",
  label: "Company page cover",
  width: W,
  height: H,
  description: "Company page cover, 1128 × 191. The company logo overlaps the lower left on desktop.",
  safe: { x: 40, y: 20, width: W - 80, height: H - 40 },
  covered: [{ x: 16, y: 110, width: 160, height: 81 }],
  render(ctx) {
    const { surface, content } = ctx;
    const x = 220;
    // A very thin strip: one line of headline, trimmed to fit before the website pill.
    const site = pill(ctx, 0, 0, content.website, 16, { fill: surface.primary, text: onPrimaryLarge(ctx) }, 360);
    const siteX = W - 60 - site.width;
    const line = wrap(ctx, content.headline, siteX - x - 110, 30, "h", 1)[0] ?? "";
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 32))}
      ${logo(ctx, { x: x, y: 44, width: 34, height: 34 }, undefined, "li-co-mark")}
      ${text(x + 46, 70, truncate(ctx, content.name, siteX - 40 - x - 46, 22, "h"), { size: 22, fill: surface.text, font: "h" })}
      ${text(x, 122, line, { size: 30, fill: surface.text, font: "h" })}
      <g transform="translate(${siteX} ${H / 2 - 19})">${site.markup}</g>`;
    return mockupDoc(ctx, W, H, body);
  },
};
