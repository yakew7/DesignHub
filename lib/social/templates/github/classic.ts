import { logo, onPrimaryLarge, text, textWidth, truncate } from "@/lib/mockups/kit";
import { githubBanner, H, W } from "@/lib/social/templates/github/kit";
import { backdrop, glowBackdrop, heading, lockup, pill, share } from "@/lib/social/templates/shared";

/** The original DesignHub banner: lockup, headline, tagline, website and handle, big mark on the right. */
export const githubClassic = githubBanner(
  "Classic",
  "The original banner: headline, tagline and a big mark.",
  (ctx) => {
    const { surface, content } = ctx;
    const p = ctx.layout.padding;
    const title = heading(ctx, content.headline, p, 300, W * 0.56, 64, surface.text, { maxLines: 3 });
    const colors = { fill: surface.primary, text: onPrimaryLarge(ctx) };
    // The website pill and the handle share the bottom row.
    const [siteMax, handleMax] = share(
      pill(ctx, p, 0, content.website, 22, colors).width,
      textWidth(ctx, content.handle, 22, "bb"),
      W - p * 2 - 24,
    );
    const cta = pill(ctx, p, H - p - 58, content.website, 22, colors, siteMax);
    const handle = truncate(ctx, content.handle, Math.min(handleMax, W - p * 2 - 24 - cta.width), 22, "bb");
    return {
      body: `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 40))}
      ${lockup(ctx, p, 124, 48, undefined, "classic-lockup", W - p * 2)}
      ${title.markup}
      ${text(p, title.bottom + 64, content.subtitle, { size: 26, fill: surface.muted })}
      ${cta.markup}
      ${text(p + cta.width + 24, H - p - 21, handle, { size: 22, fill: surface.muted, font: "bb" })}
      <g opacity=".95">${logo(ctx, { x: W - 380, y: H / 2 - 150, width: 300, height: 300 }, undefined, "classic-mark")}</g>`,
    };
  },
);
