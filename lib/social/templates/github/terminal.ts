import { brandSurface } from "@/lib/brand/theme";
import { escapeXml, logo, wrap } from "@/lib/mockups/kit";
import { githubBanner, H, MONO, MONO_ADVANCE, mono, slugOf, truncateMono, W } from "@/lib/social/templates/github/kit";
import { backdrop } from "@/lib/social/templates/shared";

const GREEN = "#4ade80";

/** A dark terminal window with a few lines of shell and a blinking-cursor title. */
export const githubTerminal = githubBanner("Terminal", "Monospace, code inspired, with green accents.", (ctx) => {
  const { surface, content } = ctx;
  const term = brandSurface(ctx.brand, "dark");
  const p = Math.max(40, ctx.layout.padding - 24);
  const x = p;
  const y = p;
  const w = W - p * 2;
  const h = H - p * 2;
  const r = Math.min(ctx.brand.radius + 4, 20);
  const left = x + 44;
  const slug = slugOf(ctx);
  const nameSize = 64;
  // Lines end before the logo (top) or the right edge of the window.
  const inner = x + w - 44 - left;
  const name = truncateMono(content.name, inner - nameSize, nameSize);
  const cursorX = left + name.length * nameSize * MONO_ADVANCE + 12;
  const comment = wrap(ctx, content.headline, w - 300, 22, "b", 2);
  return {
    defs: `<filter id="term-shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000" flood-opacity=".35"/></filter>`,
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="${ctx.mode === "dark" ? "#050806" : surface.surface}"/>`)}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#0b0f0d" stroke="#1f2a24" filter="url(#term-shadow)"/>
      <path d="M${x} ${y + r}a${r} ${r} 0 0 1 ${r} ${-r}h${w - r * 2}a${r} ${r} 0 0 1 ${r} ${r}v26H${x}Z" fill="#111814"/>
      <circle cx="${x + 26}" cy="${y + 24}" r="7" fill="#ff5f57"/><circle cx="${x + 48}" cy="${y + 24}" r="7" fill="#febc2e"/><circle cx="${x + 70}" cy="${y + 24}" r="7" fill="#28c840"/>
      ${mono(x + w / 2, y + 29, truncateMono(`~/${content.github}/${slug} - zsh`, w - 220, 14), { size: 14, fill: "#8b9a91", anchor: "middle" })}
      ${logo(ctx, { x: x + w - 96, y: y + 76, width: 56, height: 56 }, undefined, "term-mark")}
      ${mono(left, y + 110, truncateMono(`$ git clone github.com/${content.github}/${slug}`, inner - 96, 20), { size: 20, fill: "#c9d5ce" })}
      ${mono(left, y + 146, truncateMono(`$ cd ${slug} && pnpm dev`, inner - 96, 20), { size: 20, fill: "#c9d5ce" })}
      <text x="${left}" y="${y + 250}" font-family="${MONO}" font-size="${nameSize}" font-weight="700" fill="#ffffff">${escapeXml(name)}</text>
      <rect x="${Math.min(cursorX, x + w - 60)}" y="${y + 250 - nameSize * 0.78}" width="${nameSize * 0.5}" height="${nameSize * 0.86}" fill="${GREEN}"/>
      ${comment.map((line, i) => mono(left, y + 300 + i * 32, `${i === 0 ? "// " : "   "}${line}`, { size: 20, fill: "#7f8d85" })).join("")}
      ${mono(left, y + 300 + comment.length * 32 + 34, "✓ Ready", { size: 20, fill: GREEN, weight: 700 })}
      ${mono(left + 118, y + 300 + comment.length * 32 + 34, truncateMono(`→ ${content.website}`, inner - 118, 20), { size: 20, fill: term.primaryText, weight: 600 })}
      <rect x="${x}" y="${y + h - 40}" width="${w}" height="1" fill="#1f2a24"/>
      ${mono(left, y + h - 14, truncateMono(`main  ●  ${content.github}/${slug}`, inner - 140, 14), { size: 14, fill: "#6b7a72" })}
      ${mono(x + w - 44, y + h - 14, "UTF-8  zsh", { size: 14, fill: "#6b7a72", anchor: "end" })}`,
  };
});
