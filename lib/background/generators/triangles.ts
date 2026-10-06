import { spacingFor } from "@/lib/background/pattern";
import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  // Density sets the triangle side (sparse is large), scale multiplies it.
  const side = r1(spacingFor(settings.density, settings.scale, 180, 28));
  const rowHeight = r1((side * Math.sqrt(3)) / 2);
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  return { side, rowHeight, colors };
}

/**
 * Color slot of the triangle in a row and column. Neighbours along a row differ by one column and
 * neighbours across rows by one row, so no two triangles that share an edge get the same slot.
 */
export function triangleSlot(column: number, row: number, count: number, start: number): number {
  return (((start + column + row) % count) + count) % count;
}

/** A repeating grid of equilateral triangles that alternate between the palette colors. */
export const triangles: BackgroundDefinition = {
  kind: "triangles",
  label: "Triangles",
  description: "Grid of equilateral triangles alternating between the palette colors.",
  defaults: { density: 50, scale: 1 },
  render(settings) {
    const { width, height } = settings;
    const { side, rowHeight, colors } = geometry(settings);
    // With one color the other half of the triangles shows the canvas color.
    const count = Math.max(2, colors.length);
    // The tile must repeat both the up/down alternation (2) and the color cycle (count).
    const period = count % 2 === 0 ? count : count * 2;
    const half = side / 2;
    const random = createRandom(settings.seed);
    // The seed picks which color comes first and where the grid starts.
    const start = Math.floor(random() * count);
    const offsetX = r1(random() * period * half);
    const offsetY = r1(random() * period * rowHeight);
    const paths: string[] = Array.from({ length: count }, () => "");
    for (let row = 0; row < period; row += 1) {
      const top = r1(row * rowHeight);
      const bottom = r1((row + 1) * rowHeight);
      // Column -1 fills the half triangle cut off at the left edge of the tile.
      for (let column = -1; column < period; column += 1) {
        const left = r1(column * half);
        const up = (((column + row) % 2) + 2) % 2 === 0;
        paths[triangleSlot(column, row, count, start)] += up
          ? `M${left} ${bottom}L${r1(left + half)} ${top}L${r1(left + side)} ${bottom}Z`
          : `M${left} ${top}L${r1(left + side)} ${top}L${r1(left + half)} ${bottom}Z`;
      }
    }
    // A hairline stroke in the fill color hides the anti-aliasing seams between triangles.
    const tile = paths
      .map((d, slot) => {
        const color = colors[slot];
        return color && d ? `<path d="${d}" fill="${color}" stroke="${color}" stroke-width="0.6"/>` : "";
      })
      .join("");
    // Rotate the pattern rather than the drawing, like crosshatch, so the edges stay crisp.
    const defs = `<pattern id="triangles" width="${r1(period * half)}" height="${r1(period * rowHeight)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${settings.rotation} ${width / 2} ${height / 2}) translate(${offsetX} ${offsetY})">${tile}</pattern>`;
    return wrapSvg(
      { ...settings, rotation: 0 },
      `<rect width="${width}" height="${height}" fill="url(#triangles)"/>`,
      defs,
    );
  },
};
