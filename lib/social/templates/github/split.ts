import { logo, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { body, githubBanner, githubChip, H, W, websitePill } from "@/lib/social/templates/github/kit";
import { backdrop, heading } from "@/lib/social/templates/shared";

/** Content on the left, a slanted brand block with a huge logo on the right. */
export const githubSplit = githubBanner("Split", "Content left, a large logo right, strong asymmetry.", (ctx) => {
  const { surface, content } = ctx;
  const p = ctx.layout.padding;
  const on = onPrimaryLarge(ctx);
  const edge = W * 0.6;
  const slant = 90;
  const textWidth = edge - p - 70;
  const title = heading(ctx, content.name, p, 250, textWidth, 76, surface.text, { maxLines: 1 });
  const description = body(ctx, content.headline, p, title.bottom + 54, textWidth, 24, surface.muted, { maxLines: 3 });
  const site = websitePill(ctx, p, H - p - 44, 18, { fill: surface.primary, text: on });
  const repo = githubChip(ctx, p + site.width + 12, H - p - 44, 18, {
    fill: surface.background,
    text: surface.text,
    stroke: surface.border,
  });
  const markSize = 300;
  const markX = edge + (W - edge - markSize) / 2 + slant / 3;
  return {
    defs: `<linearGradient id="split-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>`,
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${surface.background}"/>`)}
      <path d="M${edge + slant} 0H${W}V${H}H${edge}Z" fill="url(#split-fill)"/>
      <path d="M${edge + slant - 24} 0L${edge - 24} ${H}" stroke="${surface.primary}" stroke-opacity=".35" stroke-width="3"/>
      ${logo(ctx, { x: markX, y: (H - markSize) / 2, width: markSize, height: markSize }, on, "split-mark")}
      ${text(p, p + 20, "OPEN SOURCE PROJECT", { size: 15, fill: surface.primaryText, font: "bb", spacing: 4 })}
      ${title.markup}
      ${description.markup}
      ${site.markup}
      ${repo.markup}`,
  };
});
