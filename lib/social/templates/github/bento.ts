import { logo, text } from "@/lib/mockups/kit";
import { body, branchIcon, githubBanner, H, starIcon, W } from "@/lib/social/templates/github/kit";
import { backdrop, heading } from "@/lib/social/templates/shared";

/** Modular cards in an Apple-like bento grid. */
export const githubBento = githubBanner("Bento", "Modular cards in a modern bento grid.", (ctx) => {
  const { surface, content } = ctx;
  const p = Math.max(32, ctx.layout.padding - 40);
  const gap = 16;
  const r = Math.min(ctx.brand.radius + 8, 28);
  const innerW = W - p * 2;
  const innerH = H - p * 2;
  const bigW = innerW * 0.56;
  const colX = p + bigW + gap;
  const colW = innerW - bigW - gap;
  const halfW = (colW - gap) / 2;
  const topH = innerH * 0.56;
  const botH = innerH - topH - gap;
  const card = (x: number, y: number, w: number, h: number, fill = surface.surface, stroke = surface.border) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;

  const title = heading(ctx, content.name, p + 44, p + innerH - 150, bigW - 88, 64, surface.text, { maxLines: 1 });
  const description = body(ctx, content.headline, p + 44, title.bottom + 44, bigW - 88, 21, surface.muted, {
    maxLines: 2,
  });
  const bottomY = p + topH + gap;
  return {
    defs: `<filter id="bento-tile" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity=".22"/></filter><linearGradient id="bento-accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>`,
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${ctx.mode === "dark" ? "#08080b" : surface.surface}"/>`)}
      ${card(p, p, bigW, innerH, surface.background)}
      ${text(p + 44, p + 64, "OPEN SOURCE", { size: 14, fill: surface.primaryText, font: "bb", spacing: 4 })}
      ${title.markup}
      ${description.markup}
      ${card(colX, p, colW, topH, "url(#bento-accent)", "none")}
      <rect x="${colX + colW / 2 - 84}" y="${p + topH / 2 - 84}" width="168" height="168" rx="${Math.min(r + 12, 40)}" fill="#ffffff" filter="url(#bento-tile)"/>
      ${logo(ctx, { x: colX + colW / 2 - 56, y: p + topH / 2 - 56, width: 112, height: 112 }, undefined, "bento-mark")}
      ${card(colX, bottomY, halfW, botH)}
      ${branchIcon(colX + 28, bottomY + 28, 28, surface.primaryText)}
      ${text(colX + 28, bottomY + botH - 48, "GitHub", { size: 14, fill: surface.muted, font: "bb" })}
      ${text(colX + 28, bottomY + botH - 22, content.github, { size: 20, fill: surface.text, font: "bb" })}
      ${card(colX + halfW + gap, bottomY, halfW, botH)}
      ${starIcon(colX + halfW + gap + 28, bottomY + 28, 28, "#f5b83d")}
      ${text(colX + halfW + gap + 28, bottomY + botH - 48, "Website", { size: 14, fill: surface.muted, font: "bb" })}
      ${text(colX + halfW + gap + 28, bottomY + botH - 22, content.website, { size: 20, fill: surface.text, font: "bb" })}`,
  };
});
