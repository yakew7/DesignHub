import { lines, logo, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { githubBanner, githubChip, H, W, websitePill } from "@/lib/social/templates/github/kit";
import { backdrop, glowBackdrop, heading, lockup } from "@/lib/social/templates/shared";

/** Classic copy on the left, a product window bleeding off the right edge. */
export const githubShowcase = githubBanner("Showcase", "Headline and details beside a product window.", (ctx) => {
  const { surface, content, brand } = ctx;
  const p = ctx.layout.padding;
  const r = Math.min(brand.radius + 4, 20);
  const colW = W * 0.46 - p;
  const title = heading(ctx, content.headline, p, 270, colW, 54, surface.text, { maxLines: 3 });
  const site = websitePill(ctx, p, H - p - 44, 18, { fill: surface.primary, text: onPrimaryLarge(ctx) });
  const repo = githubChip(ctx, p + site.width + 12, H - p - 44, 18, {
    fill: surface.background,
    text: surface.text,
    stroke: surface.border,
  });
  const fx = W * 0.54;
  const fy = 96;
  const fw = W - fx + 80;
  const fh = H - fy + 80;
  const bar = 52;
  const inner = fx + 36;
  return {
    defs: `<filter id="show-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000" flood-opacity="${ctx.mode === "dark" ? 0.45 : 0.16}"/></filter>`,
    body: `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 40))}
      ${lockup(ctx, p, 124, 44, undefined, "show-lockup")}
      ${title.markup}
      ${text(p, title.bottom + 52, content.subtitle, { size: 22, fill: surface.muted })}
      ${site.markup}
      ${repo.markup}
      <g filter="url(#show-shadow)"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${r}" fill="${surface.background}" stroke="${surface.border}"/></g>
      <path d="M${fx} ${fy + r}a${r} ${r} 0 0 1 ${r} ${-r}H${fx + fw}V${fy + bar}H${fx}Z" fill="${surface.surface}"/>
      <circle cx="${fx + 26}" cy="${fy + 26}" r="6" fill="#ff5f57"/><circle cx="${fx + 46}" cy="${fy + 26}" r="6" fill="#febc2e"/><circle cx="${fx + 66}" cy="${fy + 26}" r="6" fill="#28c840"/>
      <rect x="${fx + 96}" y="${fy + 13}" width="${fw - 180}" height="26" rx="13" fill="${surface.background}" stroke="${surface.border}"/>
      ${text(fx + 116, fy + 31, content.website, { size: 14, fill: surface.muted })}
      ${logo(ctx, { x: inner, y: fy + bar + 34, width: 40, height: 40 }, undefined, "show-app")}
      ${text(inner + 56, fy + bar + 62, content.name, { size: 24, fill: surface.text, font: "h" })}
      ${lines(inner, fy + bar + 104, fw - 200, 3, 26, surface.border)}
      <rect x="${inner}" y="${fy + bar + 196}" width="${(fw - 220) / 2}" height="150" rx="${r}" fill="${surface.primary}" fill-opacity=".14"/>
      <rect x="${inner + (fw - 220) / 2 + 16}" y="${fy + bar + 196}" width="${(fw - 220) / 2}" height="150" rx="${r}" fill="${surface.secondary}" fill-opacity=".14"/>
      <rect x="${inner + 24}" y="${fy + bar + 300}" width="96" height="22" rx="11" fill="${surface.primary}"/>`,
  };
});
