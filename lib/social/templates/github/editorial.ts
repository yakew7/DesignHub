import { text } from "@/lib/mockups/kit";
import { githubBanner, H, W } from "@/lib/social/templates/github/kit";
import { backdrop, heading } from "@/lib/social/templates/shared";

/** Magazine layout: rules, a folio line and a big bold headline. */
export const githubEditorial = githubBanner("Editorial", "Large bold heading in a magazine layout.", (ctx) => {
  const { surface, content } = ctx;
  const p = ctx.layout.padding;
  const top = p + 10;
  const size = 78;
  const leading = 1.02;
  // Centre the headline between the two rules, whatever its line count.
  const lines = heading(ctx, content.headline, p, 0, W - p * 2, size, surface.text, { maxLines: 3, leading }).lines;
  const areaTop = top + 24;
  const areaBottom = H - p - 48;
  const blockHeight = size * 0.72 + (lines - 1) * size * leading;
  const firstBaseline = areaTop + (areaBottom - areaTop - blockHeight) / 2 + size * 0.72;
  const title = heading(ctx, content.headline, p, firstBaseline, W - p * 2, size, surface.text, {
    maxLines: 3,
    leading,
  });
  const rule = (y: number, weight = 1.5) =>
    `<rect x="${p}" y="${y}" width="${W - p * 2}" height="${weight}" fill="${surface.text}" fill-opacity=".85"/>`;
  return {
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${surface.background}"/>`)}
      <rect x="${p}" y="${top - 13}" width="14" height="14" fill="${surface.primary}"/>
      ${text(p + 26, top, "NO. 01  ·  OPEN SOURCE", { size: 15, fill: surface.text, font: "bb", spacing: 3 })}
      ${text(W - p, top, content.name.toUpperCase(), { size: 15, fill: surface.text, font: "bb", anchor: "end", spacing: 3 })}
      ${rule(top + 24, 3)}
      ${title.markup}
      ${rule(H - p - 48)}
      ${text(p, H - p, content.subtitle, { size: 19, fill: surface.muted })}
      ${text(W - p, H - p, `${content.website}   /   github.com/${content.github}`, { size: 19, fill: surface.text, font: "bb", anchor: "end" })}`,
  };
});
