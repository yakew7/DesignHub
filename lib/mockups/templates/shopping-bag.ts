import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 1600;
const H = 1200;
const FLOOR = 860;

type Bag = {
  /** Front panel. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** How far the side panel recedes to the right and up. */
  depth: number;
  rise: number;
  front: string;
  side: string;
  rope: string;
  /** Artwork printed on the front, in front-panel coordinates. */
  print: string;
};

/** A paper bag in three-quarter view: front panel, folded side gusset, open top and rope handles. */
function bag(b: Bag, dark: boolean): string {
  const { x, y, width, height, depth, rise } = b;
  const right = x + width;
  const bottom = y + height;
  const backX = x + depth;
  const backY = y - rise;
  const mid = right + depth / 2;
  const handle = (left: number, top: number, span: number, lift: number, opacity = 1) =>
    `<path d="M${left} ${top} C${left - 6} ${top - lift} ${left + span + 6} ${top - lift} ${left + span} ${top}" fill="none" stroke="${b.rope}" stroke-width="${Math.max(6, width / 50)}" stroke-linecap="round"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ""}/>`;
  const span = width * 0.36;
  const holeL = x + (width - span) / 2;
  const holeY = y + width * 0.07;
  const hole = (cx: number, cy: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${width / 52}" fill="#000" fill-opacity=".45"/><circle cx="${cx}" cy="${cy}" r="${width / 52}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;

  return `<g>
    <ellipse cx="${x + width / 2 + depth / 2}" cy="${bottom + 4}" rx="${width / 2 + depth}" ry="${width / 16}" fill="#000" fill-opacity="${dark ? 0.55 : 0.25}" filter="url(#bag-blur)"/>
    <path d="M${x} ${y} L${backX} ${backY} H${right + depth} L${right} ${y} Z" fill="${b.side}"/>
    <path d="M${x} ${y} L${backX} ${backY} H${right + depth} L${right} ${y} Z" fill="#000" fill-opacity=".45"/>
    ${handle(holeL + depth, holeY - rise, span, width * 0.48, 0.85)}
    <path d="M${right} ${y} L${mid} ${y + depth * 0.45} L${right + depth} ${backY} Z" fill="${b.side}"/>
    <path d="M${right} ${y} L${mid} ${y + depth * 0.45} L${right + depth} ${backY} Z" fill="#000" fill-opacity=".38"/>
    <path d="M${right} ${y} L${mid} ${y + depth * 0.45} L${right + depth} ${backY} V${bottom - rise} L${right} ${bottom} Z" fill="${b.side}"/>
    <path d="M${right} ${y} L${mid} ${y + depth * 0.45} V${bottom - rise / 2} L${right} ${bottom} Z" fill="#000" fill-opacity=".14"/>
    <path d="M${mid} ${y + depth * 0.45} V${bottom - rise / 2}" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
    <path d="M${right} ${y} L${mid} ${y + depth * 0.45} L${right + depth} ${backY}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${b.front}"/>
    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden">${b.print}</svg>
    <rect x="${x}" y="${y}" width="${width}" height="${width * 0.11}" fill="#000" fill-opacity=".06"/>
    <path d="M${x} ${y + width * 0.11} H${right}" stroke="#000" stroke-opacity=".1" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#bag-shade)"/>
    ${hole(holeL, holeY)}${hole(holeL + span, holeY)}
    ${handle(holeL, holeY, span, width * 0.5)}
  </g>`;
}

/** The main bag's print: mark, name and website on the paper. */
function frontPrint(ctx: MockupContext, width: number, height: number): string {
  const { surface, brand, content } = ctx;
  const mark = width * 0.4;
  const name = wrap(ctx, brand.name, width * 0.8, width * 0.1, "h", 2);
  const size = width * 0.1;
  const top = height * 0.62;
  return `${logo(ctx, { x: (width - mark) / 2, y: height * 0.22, width: mark, height: mark }, ctx.mode === "dark" ? surface.text : undefined, "bag-front")}
    ${name.map((line, i) => text(width / 2, top + i * size * 1.1, line, { size, fill: surface.text, font: "h", anchor: "middle" })).join("")}
    <rect x="0" y="${height - width * 0.16}" width="${width}" height="${width * 0.16}" fill="${surface.primary}"/>
    ${text(width / 2, height - width * 0.06, content.website, { size: width * 0.045, fill: onPrimaryLarge(ctx), font: "bb", anchor: "middle", spacing: 2 })}`;
}

export const shoppingBag: MockupTemplate = {
  id: "shopping-bag",
  label: "Shopping bag",
  category: "Print",
  description: "Paper shopping bags with rope handles, the logo on the front and the brand color on the side.",
  render(ctx) {
    const { surface, mode } = ctx;
    const dark = mode === "dark";
    const on = onPrimaryLarge(ctx);
    // Natural paper by day and black paper at night. Product colors, not brand values.
    const paper = dark ? "#222227" : "#f6f3ee";

    const main = { x: 640, y: 400, width: 440, height: 600, depth: 140, rise: 34 };
    const small = { x: 330, y: 610, width: 300, height: 390, depth: 96, rise: 24 };
    const smallMark = small.width * 0.42;

    const back = bag(
      {
        ...small,
        front: surface.primary,
        side: paper,
        rope: paper,
        print: logo(
          ctx,
          { x: (small.width - smallMark) / 2, y: small.height * 0.36, width: smallMark, height: smallMark },
          on,
          "bag-small-mark",
        ),
      },
      dark,
    );
    const front = bag(
      {
        ...main,
        front: paper,
        side: surface.primary,
        rope: surface.secondary,
        print: frontPrint(ctx, main.width, main.height),
      },
      dark,
    );

    const defs = `<linearGradient id="bag-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.06 : 0.12}"/>
        <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.2 : 0.08}"/>
      </linearGradient>
      <linearGradient id="bag-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${dark ? surface.surface : surface.background}"/>
        <stop offset="1" stop-color="${dark ? surface.background : surface.surface}"/>
      </linearGradient>
      <linearGradient id="bag-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.06 : 0.25}"/>
        <stop offset=".08" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.5 : 0.18}"/>
      </linearGradient>
      <radialGradient id="bag-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="${surface.secondary}" stop-opacity="${dark ? 0.32 : 0.18}"/>
        <stop offset="1" stop-color="${surface.secondary}" stop-opacity="0"/>
      </radialGradient>
      <filter id="bag-blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>`;

    // A wall in the brand surface colors and a neutral floor in the same family.
    const scene = `<rect width="${W}" height="${FLOOR}" fill="url(#bag-wall)"/>
      <circle cx="820" cy="520" r="620" fill="url(#bag-glow)"/>
      <rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="${surface.surface}"/>
      <rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="url(#bag-floor)"/>`;

    return mockupDoc(ctx, W, H, `${scene}${back}${front}`, defs);
  },
};
