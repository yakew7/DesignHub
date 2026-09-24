import { logo, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { body, githubBanner, H, W } from "@/lib/social/templates/github/kit";
import { backdrop, heading, meshBackdrop } from "@/lib/social/templates/shared";

/** A loud brand mesh with big white type: startup launch energy. */
export const githubGradient = githubBanner("Gradient", "Bold colorful mesh for startup branding.", (ctx) => {
  const { content } = ctx;
  const p = ctx.layout.padding;
  // The template's own mesh and the gradient override are deep and colorful; the others follow the theme.
  const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
  const on = onColor ? onPrimaryLarge(ctx) : ctx.surface.text;
  const title = heading(ctx, content.name, p, H / 2 + 20, W - p * 2 - 180, 104, on, { maxLines: 1 });
  const description = body(ctx, content.headline, p, title.bottom + 60, W * 0.6, 27, on, { maxLines: 2, opacity: 0.9 });
  return {
    defs: `<filter id="grad-noise"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>`,
    body: `${backdrop(ctx, W, H, () => meshBackdrop(ctx, W, H, "#0b0b16"))}
      <rect width="${W}" height="${H}" filter="url(#grad-noise)"/>
      ${logo(ctx, { x: p, y: p, width: 56, height: 56 }, on, "grad-mark")}
      ${text(W - p, p + 36, `github.com/${content.github}`, { size: 20, fill: on, font: "bb", anchor: "end", opacity: 0.9 })}
      ${title.markup}
      ${description.markup}
      <rect x="${p}" y="${H - p - 4}" width="64" height="4" rx="2" fill="${on}"/>
      ${text(p + 84, H - p + 3, content.website, { size: 22, fill: on, font: "bb" })}`,
  };
});
