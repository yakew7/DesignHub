import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { r1 } from "@/lib/background/random";
import type { BackgroundDefinition } from "@/types/background";

function hexPath(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${r1(cx + r * Math.cos(angle))} ${r1(cy + r * Math.sin(angle))}`;
  });
  return `M${points.join("L")}Z`;
}

/** Honeycomb outlines, with faint fills from the second color. */
export const hexagons: BackgroundDefinition = {
  kind: "hexagons",
  label: "Hexagons",
  description: "Honeycomb grid, techy and structured.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const r = r1(spacingFor(settings.density, settings.scale, 90, 16));
    const w = r1(Math.sqrt(3) * r);
    const h = r1(r * 3);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    const line = colors[0]!;
    const fill = colors[1] ?? "none";
    const stroke = r1(Math.max(1, r * 0.08));
    // Pointy-top honeycomb: rows 1.5r apart, alternate rows shifted by half a cell.
    // Hexes that straddle the tile edge are drawn on both sides so the pattern is seamless.
    const centers = [
      [w / 2, r],
      [0, r * 2.5],
      [w, r * 2.5],
      [0, -r * 0.5],
      [w, -r * 0.5],
      [w / 2, r * 4],
    ];
    const cells = centers.map(([x, y]) => `<path d="${hexPath(x!, y!, r)}"/>`).join("");
    return patternSvg(
      settings,
      w,
      h,
      `<g stroke="${line}" stroke-width="${stroke}" fill="${fill}" fill-opacity="${fill === "none" ? 0 : 0.1}">${cells}</g>`,
    );
  },
};
