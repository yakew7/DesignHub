import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 2000;
const H = 1300;
const FW = 1500;
const FH = 620;
const GROUND = 1110;

/** The poster layout (gradient, rings, mark, name, headline, call to action, website) on a landscape face. */
function face(ctx: MockupContext): string {
  const { surface, content, brand } = ctx;
  const on = onPrimaryLarge(ctx);
  const pad = 90;
  const size = 92;
  const headline = wrap(ctx, content.headline, 980, size, "h", 2);
  const top = headline.length > 1 ? 300 : 350;
  const title = headline
    .map((line, i) => text(pad, top + i * size * 1.05, line, { size, fill: on, font: "h" }))
    .join("");
  const cta = content.cta.trim();
  const ctaWidth = cta ? ctx.measure(cta, brand.typography.body, 600, 28) + 76 : 0;
  const ctaY = top + (headline.length - 1) * size * 1.05 + 52;
  return `<rect width="${FW}" height="${FH}" fill="url(#bb-bg)"/>
    <circle cx="${FW - 220}" cy="150" r="330" fill="${on}" fill-opacity=".08"/>
    <circle cx="${FW - 120}" cy="300" r="190" fill="${on}" fill-opacity=".08"/>
    ${logo(ctx, { x: pad, y: 70, width: 96, height: 96 }, on, "bb-mark")}
    ${text(pad + 124, 130, brand.name.toUpperCase(), { size: 30, fill: on, font: "bb", spacing: 6, opacity: 0.85 })}
    ${title}
    ${cta ? `<rect x="${pad}" y="${ctaY}" width="${ctaWidth}" height="76" rx="38" fill="${on}"/>${text(pad + ctaWidth / 2, ctaY + 48, cta, { size: 28, fill: surface.primary, font: "bb", anchor: "middle" })}` : ""}
    ${logo(ctx, { x: FW - 400, y: 150, width: 300, height: 300 }, on, "bb-hero")}
    ${text(FW - pad, FH - 60, content.website, { size: 28, fill: on, font: "bb", anchor: "end", opacity: 0.9 })}`;
}

export const billboard: MockupTemplate = {
  id: "billboard",
  label: "Billboard",
  category: "Print",
  description: "A roadside billboard showing the poster layout in perspective.",
  render(ctx) {
    const { surface, mode } = ctx;
    const dark = mode === "dark";
    // Sky, ground and steel are scenery, not brand values: daylight in light mode, night in dark.
    const [skyTop, skyBottom] = dark ? ["#070912", "#1b1f2e"] : ["#cfdbe6", "#eef1f2"];
    const [groundTop, groundBottom] = dark ? ["#121318", "#08090b"] : ["#b9b4aa", "#8f8a80"];
    const steel = dark ? "#2a2c33" : "#4a4d55";
    const steelLight = dark ? "#3a3d46" : "#6b6f78";

    // The face, frame and catwalk share one skewed group, so the board recedes to the right
    // while its posts stay vertical.
    const skew = -0.12;
    const scale = 0.9;
    const x0 = 280;
    const y0 = 330;
    const postBottom = (x: number) => GROUND + 20 - y0 - skew * scale * x;

    const lamps = [0.18, 0.5, 0.82]
      .map((t) => {
        const x = FW * t;
        return `<path d="M${x} -18 V-70 H${x + 26}" fill="none" stroke="${steel}" stroke-width="8"/>
          <rect x="${x + 10}" y="-84" width="56" height="24" rx="6" fill="${steelLight}"/>`;
      })
      .join("");
    const beams = dark
      ? [0.18, 0.5, 0.82]
          .map((t) => {
            const x = FW * t + 38;
            return `<path d="M${x - 20} -60 L${x - 260} ${FH} H${x + 300} L${x + 20} -60 Z" fill="url(#bb-beam)"/>`;
          })
          .join("")
      : "";
    const posts = [FW * 0.28, FW * 0.72]
      .map((x) => `<rect x="${x - 26}" y="${FH}" width="52" height="${postBottom(x) - FH}" fill="${steel}"/>`)
      .join("");

    const board = `<g transform="translate(${x0} ${y0}) matrix(${scale} ${skew * scale} 0 1 0 0)">
      ${posts}
      <rect x="-22" y="-22" width="${FW + 44}" height="${FH + 44}" rx="6" fill="${steel}" filter="url(#soft)"/>
      <svg x="0" y="0" width="${FW}" height="${FH}" viewBox="0 0 ${FW} ${FH}" overflow="hidden">${face(ctx)}</svg>
      <rect width="${FW}" height="${FH}" fill="url(#bb-sheen)"/>
      ${beams}
      <rect x="-40" y="${FH + 22}" width="${FW + 80}" height="18" fill="${steelLight}"/>
      <path d="M-40 ${FH + 40} V${FH + 70} M${FW + 40} ${FH + 40} V${FH + 70} M-40 ${FH + 70} H${FW + 40}" fill="none" stroke="${steelLight}" stroke-width="5"/>
      ${lamps}
    </g>`;

    const defs = `<linearGradient id="bb-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>
      <linearGradient id="bb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>
      <linearGradient id="bb-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${groundTop}"/><stop offset="1" stop-color="${groundBottom}"/></linearGradient>
      <linearGradient id="bb-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0 : 0.1}"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.35 : 0.14}"/></linearGradient>
      <linearGradient id="bb-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity=".28"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>`;

    const scene = `<rect width="${W}" height="${GROUND}" fill="url(#bb-sky)"/>
      ${dark ? "" : `<circle cx="1860" cy="130" r="64" fill="#fff" fill-opacity=".7"/>`}
      ${board}
      <rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="url(#bb-ground)"/>
      <rect y="${GROUND + 70}" width="${W}" height="90" fill="#000" fill-opacity="${dark ? 0.35 : 0.18}"/>
      <path d="M0 ${GROUND + 125} H${W}" stroke="#fff" stroke-opacity="${dark ? 0.35 : 0.7}" stroke-width="6" stroke-dasharray="70 60"/>`;

    return mockupDoc(ctx, W, H, scene, defs);
  },
};
