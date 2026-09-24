import { cssRotationNote, patternSvg, spacingFor } from "@/lib/background/pattern";
import { r1 } from "@/lib/background/random";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const size = r1(spacingFor(settings.density, settings.scale, 140, 20));
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  return { size, first: colors[0]!, second: colors[1] ?? null };
}

/** Classic checkerboard, with an optional second color on the alternate squares. */
export const checks: BackgroundDefinition = {
  kind: "checks",
  label: "Checks",
  description: "Checkerboard squares, great for playful or retro sites.",
  defaults: { density: 30, scale: 1 },
  render(settings) {
    const { size, first, second } = geometry(settings);
    const alternate = second
      ? `<rect x="${size}" y="0" width="${size}" height="${size}" fill="${second}" fill-opacity=".35"/>`
      : "";
    const tile = `<rect width="${size}" height="${size}" fill="${first}"/><rect x="${size}" y="${size}" width="${size}" height="${size}" fill="${first}"/>${alternate}`;
    return patternSvg(settings, size * 2, size * 2, tile);
  },
  css(settings) {
    const { size, first } = geometry(settings);
    return [
      `  background-color: ${settings.background};`,
      `  background-image: repeating-conic-gradient(${first} 0 25%, transparent 0 50%);`,
      `  background-size: ${r1(size * 2)}px ${r1(size * 2)}px;${cssRotationNote(settings)}`,
    ].join("\n");
  },
};
