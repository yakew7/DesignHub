import { desk, logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import type { MockupTemplate } from "@/lib/mockups/types";

const W = 1800;
const H = 1200;

export const merch: MockupTemplate = {
  id: "merch",
  label: "Merch",
  category: "Print",
  description: "A T-shirt and a tote bag with the logo printed on them.",
  render(ctx) {
    const { surface, brand } = ctx;
    const on = onPrimaryLarge(ctx);
    const fabric = ctx.mode === "light" ? "#efe8d8" : "#d9d0bc";
    const ink = "#1f1d1a";

    // T-shirt, drawn in a 640 x 700 box. The joined path is stroked in its own color to round the corners.
    const shirtPath =
      "M230 24 Q320 100 410 24 L520 54 L640 176 L556 256 L490 210 L490 690 L150 690 L150 210 L84 256 L0 176 L120 54 Z";
    const shirt = `<g filter="url(#soft)">
        <path d="${shirtPath}" fill="${surface.primary}" stroke="${surface.primary}" stroke-width="14" stroke-linejoin="round"/>
      </g>
      <path d="${shirtPath}" fill="url(#merch-fabric)" stroke="url(#merch-fabric)" stroke-width="14" stroke-linejoin="round"/>
      <path d="M150 210 L120 54 M490 210 L520 54" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="3"/>
      <path d="M230 24 Q320 100 410 24" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="16" stroke-linecap="round"/>
      ${logo(ctx, { x: 240, y: 210, width: 160, height: 160 }, on, "merch-shirt")}`;

    // Tote bag, drawn in a 440 x 700 box with the handles above the body.
    const bag = `<path d="M110 190 C110 -20 330 -20 330 190" fill="none" stroke="${fabric}" stroke-width="26" stroke-linecap="round"/>
      <path d="M110 190 C110 -20 330 -20 330 190" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="26" stroke-linecap="round"/>
      <g filter="url(#soft)"><path d="M0 170 H440 L420 690 H20 Z" fill="${fabric}"/></g>
      <path d="M0 170 H440 L420 690 H20 Z" fill="url(#merch-fabric)"/>
      <path d="M0 200 H440" stroke="#000" stroke-opacity=".12" stroke-width="3"/>
      ${logo(ctx, { x: 100, y: 290, width: 240, height: 160 }, undefined, "merch-tote")}
      ${wrap(ctx, brand.name, 320, 44, "h", 2)
        .map((line, i) => text(220, 520 + i * 50, line, { size: 44, fill: ink, font: "h", anchor: "middle" }))
        .join("")}`;

    const defs = `<linearGradient id="merch-fabric" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
        <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".22"/>
      </linearGradient>`;

    return mockupDoc(
      ctx,
      W,
      H,
      `${desk(ctx, W, H)}
      <g transform="translate(280 250) scale(1.06)">${shirt}</g>
      <g transform="translate(1080 240)">${bag}</g>`,
      defs,
    );
  },
};
