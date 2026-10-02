import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import type { MockupTemplate } from "@/lib/mockups/types";

const W = 1600;
const H = 1200;
const TABLE = 820;

/** Path data for a horizontal slice of the tapered cup between `top` and `bottom`, centred on `cx`. */
function band(cx: number, top: number, bottom: number, halfWidth: (y: number) => number): string {
  const a = halfWidth(top);
  const b = halfWidth(bottom);
  return `M${cx - a} ${top} L${cx + a} ${top} L${cx + b} ${bottom} L${cx - b} ${bottom} Z`;
}

export const coffeeCup: MockupTemplate = {
  id: "coffee-cup",
  label: "Coffee cup",
  category: "Print",
  description: "A takeaway cup with the logo on its sleeve, on a table.",
  render(ctx) {
    const { surface, brand, mode } = ctx;
    const on = onPrimaryLarge(ctx);
    const dark = mode === "dark";
    // Paper cup in light mode, a black cup at night. These are product colors, not brand values.
    const paper = dark ? "#26262b" : "#f7f5f1";
    const lid = dark ? "#151518" : "#ffffff";
    const lidEdge = dark ? "#33343a" : "#dedbd5";

    const cx = 800;
    const rim = 300;
    const base = 1000;
    const halfWidth = (y: number) => 200 - ((y - rim) * 52) / (base - rim);
    const sleeveTop = 540;
    const sleeveBottom = 800;

    const body = band(cx, rim, base, halfWidth);
    const sleeve = band(cx, sleeveTop, sleeveBottom, halfWidth);
    const logoRect = { x: cx - 105, y: sleeveTop + 34, width: 210, height: 116 };
    const name = wrap(ctx, brand.name, halfWidth(sleeveBottom) * 1.6, 30, "h", 1)[0] ?? "";

    const cup = `<ellipse cx="${cx}" cy="${base + 6}" rx="${halfWidth(base) + 70}" ry="34" fill="#000" fill-opacity="${dark ? 0.5 : 0.22}" filter="url(#cup-blur)"/>
      <path d="${body}" fill="${paper}" filter="url(#soft)"/>
      <ellipse cx="${cx}" cy="${base}" rx="${halfWidth(base)}" ry="16" fill="${paper}"/>
      <path d="${sleeve}" fill="${surface.primary}"/>
      <path d="M${cx - halfWidth(sleeveTop)} ${sleeveTop + 10} L${cx + halfWidth(sleeveTop)} ${sleeveTop + 10} M${cx - halfWidth(sleeveBottom)} ${sleeveBottom - 10} L${cx + halfWidth(sleeveBottom)} ${sleeveBottom - 10}" stroke="${on}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="6 6"/>
      ${logo(ctx, logoRect, on, "cup-sleeve")}
      ${text(cx, sleeveBottom - 40, name, { size: 30, fill: on, font: "h", anchor: "middle" })}
      <path d="${body}" fill="url(#cup-shade)"/>
      <rect x="${cx - 222}" y="${rim - 22}" width="444" height="44" rx="22" fill="${lid}"/>
      <rect x="${cx - 222}" y="${rim - 22}" width="444" height="44" rx="22" fill="url(#cup-shade)"/>
      <rect x="${cx - 222}" y="${rim + 12}" width="444" height="10" rx="5" fill="#000" fill-opacity=".12"/>
      <path d="M${cx - 196} ${rim - 22} Q${cx - 190} ${rim - 76} ${cx - 120} ${rim - 82} H${cx + 120} Q${cx + 190} ${rim - 76} ${cx + 196} ${rim - 22} Z" fill="${lid}" stroke="${lidEdge}" stroke-width="2"/>
      <path d="M${cx - 196} ${rim - 22} Q${cx - 190} ${rim - 76} ${cx - 120} ${rim - 82} H${cx + 120} Q${cx + 190} ${rim - 76} ${cx + 196} ${rim - 22} Z" fill="url(#cup-shade)"/>
      <rect x="${cx + 40}" y="${rim - 78}" width="90" height="14" rx="7" fill="#000" fill-opacity=".25"/>`;

    const defs = `<linearGradient id="cup-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".22"/>
        <stop offset=".28" stop-color="#fff" stop-opacity=".18"/>
        <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".34"/>
      </linearGradient>
      <linearGradient id="cup-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${dark ? surface.surface : surface.background}"/>
        <stop offset="1" stop-color="${dark ? surface.background : surface.surface}"/>
      </linearGradient>
      <linearGradient id="cup-table" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.08 : 0.2}"/>
        <stop offset=".06" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.55 : 0.3}"/>
      </linearGradient>
      <radialGradient id="cup-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="${surface.primary}" stop-opacity="${dark ? 0.4 : 0.22}"/>
        <stop offset="1" stop-color="${surface.primary}" stop-opacity="0"/>
      </radialGradient>
      <filter id="cup-blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>`;

    // Wall in the brand surface colors with a soft primary glow, and a table in the secondary color.
    const scene = `<rect width="${W}" height="${TABLE}" fill="url(#cup-wall)"/>
      <circle cx="${cx}" cy="460" r="560" fill="url(#cup-glow)"/>
      <rect y="${TABLE}" width="${W}" height="${H - TABLE}" fill="${surface.secondary}"/>
      <rect y="${TABLE}" width="${W}" height="${H - TABLE}" fill="#000" fill-opacity="${dark ? 0.5 : 0.08}"/>
      <rect y="${TABLE}" width="${W}" height="${H - TABLE}" fill="url(#cup-table)"/>`;

    return mockupDoc(ctx, W, H, `${scene}${cup}`, defs);
  },
};
