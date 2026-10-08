import { logo, onPrimaryLarge, text, textWidth, truncate } from "@/lib/mockups/kit";
import { githubBanner, H, W } from "@/lib/social/templates/github/kit";
import { backdrop, gradientBackdrop, heading, lockup, pill, share } from "@/lib/social/templates/shared";

/** Classic layout on the brand gradient, with the call to action up front. */
export const githubLaunch = githubBanner(
  "Launch",
  "Classic layout on the brand gradient with a call to action.",
  (ctx) => {
    const { surface, content } = ctx;
    const p = ctx.layout.padding;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const title = heading(ctx, content.headline, p, 290, W * 0.56, 64, on, { maxLines: 3 });
    const cta = pill(ctx, p, H - p - 58, content.cta || "Get started", 22, {
      fill: onColor ? on : surface.primary,
      text: onColor ? surface.primary : onPrimaryLarge(ctx),
    });
    // The lockup and the repository link share the top row.
    const repo = `github.com/${content.github}`;
    const [lockupMax, repoMax] = share(
      48 * 1.3 + textWidth(ctx, ctx.brand.name, 48 * 0.8, "h"),
      textWidth(ctx, repo, 20, "bb"),
      W - p * 2 - 48,
    );
    const cx = W - 250;
    const cy = H / 2;
    return {
      body: `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${lockup(ctx, p, 124, 48, on, "launch-lockup", lockupMax)}
      ${text(W - p, 132, truncate(ctx, repo, repoMax, 20, "bb"), { size: 20, fill: on, font: "bb", anchor: "end", opacity: 0.85 })}
      ${title.markup}
      ${text(p, title.bottom + 60, content.subtitle, { size: 26, fill: on, opacity: 0.85 })}
      ${cta.markup}
      ${text(p + cta.width + 24, H - p - 21, truncate(ctx, content.website, W - p * 2 - cta.width - 24, 22, "bb"), { size: 22, fill: on, font: "bb", opacity: 0.9 })}
      <circle cx="${cx}" cy="${cy}" r="170" fill="${on}" fill-opacity=".1"/>
      <circle cx="${cx}" cy="${cy}" r="170" fill="none" stroke="${on}" stroke-opacity=".3" stroke-width="2"/>
      ${logo(ctx, { x: cx - 110, y: cy - 110, width: 220, height: 220 }, on, "launch-mark")}`,
    };
  },
);
