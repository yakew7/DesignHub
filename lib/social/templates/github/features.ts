import { onPrimaryLarge, text } from "@/lib/mockups/kit";
import { githubBanner, githubChip, H, W, websitePill } from "@/lib/social/templates/github/kit";
import { backdrop, glowBackdrop, heading, lockup } from "@/lib/social/templates/shared";

/** The tagline "Open source. Local first. Free forever." becomes three feature rows. */
function featuresFrom(tagline: string): string[] {
  const parts = tagline
    .split(/[.!;·•|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return (parts.length >= 2 ? parts : ["Open source", "Local first", "Free forever"]).slice(0, 4);
}

/** Classic headline with the tagline turned into a checklist card. */
export const githubFeatures = githubBanner("Features", "Headline plus a checklist built from your tagline.", (ctx) => {
  const { surface, content, brand } = ctx;
  const p = ctx.layout.padding;
  const r = Math.min(brand.radius + 6, 24);
  const on = onPrimaryLarge(ctx);
  const title = heading(ctx, content.headline, p, 280, W * 0.5, 58, surface.text, { maxLines: 3 });
  const site = websitePill(ctx, p, H - p - 44, 18, { fill: surface.primary, text: on });
  const repo = githubChip(ctx, p + site.width + 12, H - p - 44, 18, {
    fill: surface.background,
    text: surface.text,
    stroke: surface.border,
  });
  const items = featuresFrom(content.subtitle);
  const cw = 420;
  const rowH = 74;
  const ch = 96 + items.length * rowH;
  const cx = W - p - cw;
  const cy = (H - ch) / 2;
  const rows = items
    .map((item, i) => {
      const y = cy + 96 + i * rowH;
      return `<circle cx="${cx + 52}" cy="${y + 18}" r="17" fill="${surface.primary}"/>
        <path d="M${cx + 44} ${y + 18}l6 6 11 -12" fill="none" stroke="${on}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        ${text(cx + 86, y + 27, item, { size: 25, fill: surface.text, font: "bb" })}
        ${i < items.length - 1 ? `<rect x="${cx + 32}" y="${y + rowH - 20}" width="${cw - 64}" height="1" fill="${surface.border}"/>` : ""}`;
    })
    .join("");
  return {
    defs: `<filter id="feat-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="20" stdDeviation="26" flood-color="#000" flood-opacity="${ctx.mode === "dark" ? 0.4 : 0.12}"/></filter>`,
    body: `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 40))}
      ${lockup(ctx, p, 124, 44, undefined, "feat-lockup")}
      ${title.markup}
      ${site.markup}
      ${repo.markup}
      <g filter="url(#feat-shadow)"><rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${r}" fill="${surface.background}" stroke="${surface.border}"/></g>
      ${text(cx + 32, cy + 52, `WHY ${content.name.toUpperCase()}`, { size: 14, fill: surface.primaryText, font: "bb", spacing: 3 })}
      ${rows}`,
  };
});
