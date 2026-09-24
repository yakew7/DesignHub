import { logo, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { body, githubBanner, githubChip, H, W, websitePill } from "@/lib/social/templates/github/kit";
import { backdrop, heading } from "@/lib/social/templates/shared";

/**
 * Frosted panels over colored light. SVG has no backdrop-filter, so the blobs are drawn a
 * second time inside the panel with a heavier blur and a white wash, which reads as glass.
 */
export const githubGlass = githubBanner("Glass", "Frosted, layered panels over soft color.", (ctx) => {
  const { surface, content } = ctx;
  const dark = ctx.mode === "dark";
  const base = dark ? "#0a0a12" : "#eef0f7";
  const p = ctx.layout.padding;
  const r = Math.min(ctx.brand.radius + 12, 32);
  const blobs = `<circle cx="${W * 0.18}" cy="${H * 0.3}" r="230" fill="${surface.primary}"/>
    <circle cx="${W * 0.72}" cy="${H * 0.78}" r="260" fill="${surface.secondary}"/>
    <circle cx="${W * 0.9}" cy="${H * 0.12}" r="150" fill="${surface.primary}" fill-opacity=".8"/>`;
  const panel = { x: p, y: p, w: W * 0.6, h: H - p * 2 };
  const card = { x: W - p - 300, y: H / 2 - 150, w: 300, h: 300 };
  const glassText = dark ? "#ffffff" : "#0b0b12";
  const muted = dark ? "rgba(255,255,255,0.72)" : "rgba(11,11,18,0.68)";
  const frosted = (x: number, y: number, w: number, h: number, id: string) => `
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
    <g clip-path="url(#${id})"><g filter="url(#glass-frost)">${blobs}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${dark ? "#ffffff" : "#ffffff"}" fill-opacity="${dark ? 0.08 : 0.45}"/></g>
    <rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${r}" fill="none" stroke="#ffffff" stroke-opacity="${dark ? 0.22 : 0.7}" stroke-width="1.5"/>`;
  const title = heading(ctx, content.name, panel.x + 56, panel.y + 150, panel.w - 112, 72, glassText, { maxLines: 1 });
  const description = body(ctx, content.headline, panel.x + 56, title.bottom + 52, panel.w - 112, 23, muted, {
    maxLines: 2,
  });
  const site = websitePill(ctx, panel.x + 56, panel.y + panel.h - 96, 18, {
    fill: surface.primary,
    text: onPrimaryLarge(ctx),
  });
  const repo = githubChip(ctx, panel.x + 56 + site.width + 12, panel.y + panel.h - 96, 18, {
    fill: dark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
    text: glassText,
  });
  return {
    defs: `<filter id="glass-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
      <filter id="glass-frost" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
      <filter id="glass-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000" flood-opacity="${dark ? 0.35 : 0.12}"/></filter>`,
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${base}"/><g filter="url(#glass-blur)">${blobs}</g>`)}
      <rect x="${card.x + 36}" y="${card.y - 26}" width="${card.w - 72}" height="${card.h}" rx="${r}" fill="#ffffff" fill-opacity="${dark ? 0.05 : 0.3}" stroke="#ffffff" stroke-opacity="${dark ? 0.12 : 0.5}"/>
      <g filter="url(#glass-shadow)">${frosted(panel.x, panel.y, panel.w, panel.h, "glass-panel")}</g>
      <g filter="url(#glass-shadow)">${frosted(card.x, card.y, card.w, card.h, "glass-card")}</g>
      ${logo(ctx, { x: card.x + 70, y: card.y + 60, width: card.w - 140, height: card.h - 140 }, undefined, "glass-mark")}
      ${text(card.x + card.w / 2, card.y + card.h - 34, content.website, { size: 15, fill: muted, anchor: "middle", font: "bb" })}
      ${text(panel.x + 56, panel.y + 72, "OPEN SOURCE", { size: 14, fill: muted, font: "bb", spacing: 4 })}
      ${title.markup}
      ${description.markup}
      ${site.markup}
      ${repo.markup}`,
  };
});
