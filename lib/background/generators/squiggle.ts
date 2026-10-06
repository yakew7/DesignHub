import { smoothPath, type Point } from "@/lib/background/path";
import { createRandom, r1 } from "@/lib/background/random";
import { spacingFor } from "@/lib/background/pattern";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const spacing = r1(spacingFor(settings.density, 1, 72, 18));
  const width = r1(spacing * 3.5);
  const height = r1(spacing * Math.max(2, settings.colors.length));
  const stroke = r1(Math.max(0.5, settings.scale));
  const amplitude = r1(spacing * 0.14);
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  return { spacing, width, height, stroke, amplitude, colors };
}

/** Short, repeating wavy strokes that cycle through the selected palette. */
export const squiggle: BackgroundDefinition = {
  kind: "squiggle",
  label: "Squiggle",
  description: "Rows of short, wavy strokes in your palette colors.",
  defaults: { density: 52, scale: 1.5, rotation: 0 },
  render(settings) {
    const { width, height } = settings;
    const { spacing, width: tileWidth, height: tileHeight, stroke, amplitude, colors } = geometry(settings);
    const random = createRandom(settings.seed);
    const offsetX = r1(random() * tileWidth);
    const offsetY = r1(random() * tileHeight);
    const strokes = colors.map((color, row) => {
      const phase = random() * Math.PI * 2;
      const points: Point[] = Array.from({ length: 13 }, (_, index) => {
        const x = (index / 12) * tileWidth;
        const y = (row + 0.5) * spacing + Math.sin((index / 12) * Math.PI * 6 + phase) * amplitude;
        return [r1(x), r1(y)];
      });
      return `<path d="${smoothPath(points)}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    });
    const defs = `<pattern id="squiggle" x="${offsetX}" y="${offsetY}" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(${settings.rotation} ${width / 2} ${height / 2})">${strokes.join("")}</pattern>`;
    return wrapSvg(
      { ...settings, rotation: 0 },
      `<rect width="${width}" height="${height}" fill="url(#squiggle)"/>`,
      defs,
    );
  },
};
