import { logo, text } from "@/lib/mockups/kit";
import { body, githubBanner, githubChip, gridPattern, H, mono, W } from "@/lib/social/templates/github/kit";
import { backdrop, heading } from "@/lib/social/templates/shared";

/** Blueprint grid, crosshairs and dimension lines: a developer aesthetic. */
export const githubGrid = githubBanner("Grid", "Technical grid background with a developer feel.", (ctx) => {
  const { surface, content } = ctx;
  const p = ctx.layout.padding;
  const line = surface.text;
  const dark = ctx.mode === "dark";
  const box = 280;
  const bx = W - p - box;
  const by = (H - box) / 2;
  const cross = (x: number, y: number) =>
    `<path d="M${x - 10} ${y}H${x + 10}M${x} ${y - 10}V${y + 10}" stroke="${surface.primary}" stroke-width="1.5"/>`;
  const title = heading(ctx, content.name, p, H / 2 + 10, bx - p - 60, 84, surface.text, { maxLines: 1 });
  const description = body(ctx, content.headline, p, title.bottom + 56, bx - p - 80, 24, surface.muted, {
    maxLines: 2,
  });
  const chip = githubChip(ctx, p, H - p - 44, 18, {
    fill: surface.background,
    text: surface.text,
    stroke: surface.border,
  });
  return {
    defs: `${gridPattern("g-minor", 20, line, dark ? 0.05 : 0.05)}${gridPattern("g-major", 100, line, dark ? 0.1 : 0.09)}`,
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${surface.background}"/><rect width="${W}" height="${H}" fill="url(#g-minor)"/><rect width="${W}" height="${H}" fill="url(#g-major)"/>`)}
      ${cross(40, 40)}${cross(W - 40, 40)}${cross(40, H - 40)}${cross(W - 40, H - 40)}
      ${mono(p, p + 16, `~/${content.github}/${content.name.toLowerCase().replace(/\s+/g, "-")}`, { size: 17, fill: surface.primaryText, weight: 600 })}
      ${mono(W - p, p + 16, "x:0  y:0  w:1280  h:640", { size: 14, fill: surface.muted, anchor: "end" })}
      ${title.markup}
      ${description.markup}
      ${chip.markup}
      <rect x="${bx}" y="${by}" width="${box}" height="${box}" fill="${surface.surface}" stroke="${surface.primary}" stroke-width="1.5" stroke-dasharray="6 5"/>
      ${logo(ctx, { x: bx + 50, y: by + 50, width: box - 100, height: box - 100 }, undefined, "grid-mark")}
      <path d="M${bx} ${by - 22}H${bx + box}M${bx} ${by - 28}v12M${bx + box} ${by - 28}v12" stroke="${surface.muted}" stroke-width="1"/>
      ${text(bx + box / 2, by - 32, `${box} px`, { size: 13, fill: surface.muted, anchor: "middle" })}
      <path d="M${bx + box + 22} ${by}V${by + box}M${bx + box + 16} ${by}h12M${bx + box + 16} ${by + box}h12" stroke="${surface.muted}" stroke-width="1"/>`,
  };
});
