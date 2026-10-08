import { logo, text, textWidth, truncate } from "@/lib/mockups/kit";
import { body, githubBanner, gridPattern, H, W } from "@/lib/social/templates/github/kit";
import { backdrop, heading, share } from "@/lib/social/templates/shared";

/** Clean type, lots of whitespace and a barely-there grid. */
export const githubMinimal = githubBanner("Minimal", "Clean typography and generous whitespace.", (ctx) => {
  const { surface, content } = ctx;
  const p = ctx.layout.padding;
  const title = heading(ctx, content.name, p, H * 0.5, W - p * 2 - 200, 96, surface.text, { maxLines: 1 });
  const description = body(ctx, content.headline, p, title.bottom + 64, W * 0.58, 26, surface.muted, { maxLines: 2 });
  const footerY = H - p;
  const repo = `github.com/${content.github}`;
  const [siteMax, repoMax] = share(textWidth(ctx, content.website, 20, "bb"), textWidth(ctx, repo, 20), W - p * 2 - 48);
  return {
    defs: gridPattern("min-grid", 40, surface.text, ctx.mode === "dark" ? 0.045 : 0.04),
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${surface.background}"/><rect width="${W}" height="${H}" fill="url(#min-grid)"/>`)}
      ${logo(ctx, { x: p, y: p - 4, width: 40, height: 40 }, undefined, "min-mark")}
      <rect x="${p}" y="${p + 60}" width="48" height="3" rx="1.5" fill="${surface.primary}"/>
      ${title.markup}
      ${description.markup}
      ${text(p, footerY, truncate(ctx, content.website, siteMax, 20, "bb"), { size: 20, fill: surface.primaryText, font: "bb" })}
      ${text(W - p, footerY, truncate(ctx, repo, repoMax, 20), { size: 20, fill: surface.muted, anchor: "end" })}`,
  };
});
