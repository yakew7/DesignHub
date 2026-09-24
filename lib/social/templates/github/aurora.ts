import { logo, onPrimaryLarge } from "@/lib/mockups/kit";
import { body, githubBanner, githubChip, H, W, websitePill } from "@/lib/social/templates/github/kit";
import { backdrop, heading } from "@/lib/social/templates/shared";

/** Soft colored light behind centred content: the premium SaaS look. */
export const githubAurora = githubBanner("Aurora", "Soft colorful glow and gradient lighting.", (ctx) => {
  const { surface, content } = ctx;
  const dark = ctx.mode === "dark";
  const base = dark ? "#06060a" : surface.background;
  const blur = 90;
  const glow = (cx: number, cy: number, rx: number, ry: number, color: string, opacity: number) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" fill-opacity="${opacity}" filter="url(#aurora-blur)"/>`;
  const own = `<rect width="${W}" height="${H}" fill="${base}"/>
    ${glow(W * 0.28, H * 0.05, 420, 160, surface.primary, dark ? 0.85 : 0.45)}
    ${glow(W * 0.62, H * 0.0, 380, 150, surface.secondary, dark ? 0.75 : 0.4)}
    ${glow(W * 0.5, H * 0.18, 260, 90, "#ffffff", dark ? 0.12 : 0.5)}
    <rect width="${W}" height="${H}" fill="url(#aurora-fade)"/>`;
  const title = heading(ctx, content.name, W / 2, 330, W - 240, 80, surface.text, { maxLines: 1, anchor: "middle" });
  const description = body(ctx, content.headline, W / 2, title.bottom + 56, 760, 25, surface.muted, {
    maxLines: 2,
    anchor: "middle",
  });
  const chipSize = 19;
  const site = websitePill(ctx, 0, 0, chipSize, { fill: surface.primary, text: onPrimaryLarge(ctx) });
  const repo = githubChip(ctx, 0, 0, chipSize, {
    fill: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    text: surface.text,
    stroke: surface.border,
  });
  const rowY = Math.min(H - ctx.layout.padding - chipSize * 2.3, description.bottom + 46);
  const rowX = (W - site.width - repo.width - 16) / 2;
  return {
    defs: `<filter id="aurora-blur" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="${blur}"/></filter>
      <linearGradient id="aurora-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="${base}" stop-opacity="0"/><stop offset="1" stop-color="${base}" stop-opacity=".9"/></linearGradient>`,
    body: `${backdrop(ctx, W, H, () => own)}
      ${logo(ctx, { x: W / 2 - 36, y: 150, width: 72, height: 72 }, undefined, "aurora-mark")}
      ${title.markup}
      ${description.markup}
      <g transform="translate(${rowX} ${rowY})">${site.markup}</g>
      <g transform="translate(${rowX + site.width + 16} ${rowY})">${repo.markup}</g>`,
  };
});
