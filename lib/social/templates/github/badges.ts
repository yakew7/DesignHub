import { brandSurface } from "@/lib/brand/theme";
import { logo, text } from "@/lib/mockups/kit";
import { githubBanner, gridPattern, H, W } from "@/lib/social/templates/github/kit";
import type { SocialContext } from "@/lib/social/types";
import { backdrop, heading, lockup } from "@/lib/social/templates/shared";

/** A shields.io-style two-tone badge. Returns the markup and its width. */
function badge(ctx: SocialContext, x: number, y: number, label: string, value: string, color: string) {
  const size = 17;
  const h = 34;
  const measure = (value: string) => ctx.measure(value, ctx.brand.typography.body, 600, size);
  const lw = measure(label) + 26;
  const vw = measure(value) + 26;
  const r = Math.min(ctx.brand.radius, 8);
  const markup = `<clipPath id="badge-${label}"><rect x="${x}" y="${y}" width="${lw + vw}" height="${h}" rx="${r}"/></clipPath>
    <g clip-path="url(#badge-${label})"><rect x="${x}" y="${y}" width="${lw}" height="${h}" fill="#3f3f46"/><rect x="${x + lw}" y="${y}" width="${vw}" height="${h}" fill="${color}"/></g>
    ${text(x + lw / 2, y + 23, label, { size, fill: "#ffffff", font: "bb", anchor: "middle" })}
    ${text(x + lw + vw / 2, y + 23, value, { size, fill: "#ffffff", font: "bb", anchor: "middle" })}`;
  return { markup, width: lw + vw };
}

/** Classic layout with a README-style row of badges for every link. */
export const githubBadges = githubBanner("Badges", "Classic layout with README-style badges for your links.", (ctx) => {
  const { surface, content } = ctx;
  const p = ctx.layout.padding;
  const title = heading(ctx, content.headline, p, 290, W * 0.56, 62, surface.text, { maxLines: 3 });
  // Badge text is white, so use the light theme's primary, which is tuned to 4.5:1 against white.
  const siteColor = brandSurface(ctx.brand, "light").primaryText;
  const entries: [string, string, string][] = [
    ["repo", `github.com/${content.github}`, "#16a34a"],
    ["site", content.website, siteColor],
    ["follow", content.handle, "#0ea5e9"],
  ];
  if (content.cta.trim()) entries.push(["start", content.cta, "#d97706"]);
  let bx = p;
  const by = H - p - 34;
  const badges = entries
    .map(([label, value, color]) => {
      const b = badge(ctx, bx, by, label, value, color);
      bx += b.width + 12;
      return bx - 12 > W - 60 ? "" : b.markup;
    })
    .join("");
  return {
    defs: gridPattern("badge-grid", 40, surface.text, ctx.mode === "dark" ? 0.045 : 0.04),
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${surface.background}"/><rect width="${W}" height="${H}" fill="url(#badge-grid)"/>`)}
      ${lockup(ctx, p, 124, 48, undefined, "badge-lockup")}
      ${title.markup}
      ${text(p, title.bottom + 60, content.subtitle, { size: 24, fill: surface.muted })}
      ${badges}
      <g opacity=".95">${logo(ctx, { x: W - 370, y: H / 2 - 150, width: 290, height: 290 }, undefined, "badge-mark")}</g>`,
  };
});
