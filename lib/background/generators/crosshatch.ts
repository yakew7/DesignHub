import { spacingFor } from "@/lib/background/pattern";
import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const spacing = r1(spacingFor(settings.density, 1, 48, 8));
  // Scale sets the stroke width, capped so the lines never merge into a solid fill.
  const stroke = r1(Math.min(spacing * 0.4, Math.max(0.5, settings.scale)));
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  // The seed shifts where the first line starts, so different seeds don't all line up.
  const offset = r1(createRandom(settings.seed)() * spacing);
  return { spacing, stroke, first: colors[0]!, second: colors[1] ?? colors[0]!, offset };
}

/** Two sets of thin lines crossing at right angles. Rotation sets the angle of the first set. */
export const crosshatch: BackgroundDefinition = {
  kind: "crosshatch",
  label: "Crosshatch",
  description: "Two sets of thin crossing lines, a classic print texture.",
  defaults: { density: 60, scale: 1, rotation: 45 },
  render(settings) {
    const { width, height } = settings;
    const { spacing, stroke, first, second, offset } = geometry(settings);
    const tile = [
      `<rect width="${spacing}" height="${stroke}" fill="${first}"/>`,
      `<rect width="${stroke}" height="${spacing}" fill="${second}"/>`,
    ].join("");
    // Rotate the pattern rather than the drawing, like stripes, so the line spacing matches the CSS.
    const defs = `<pattern id="crosshatch" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse" patternTransform="rotate(${settings.rotation} ${width / 2} ${height / 2}) translate(${offset} ${offset})">${tile}</pattern>`;
    return wrapSvg(
      { ...settings, rotation: 0 },
      `<rect width="${width}" height="${height}" fill="url(#crosshatch)"/>`,
      defs,
    );
  },
  css(settings) {
    const { spacing, stroke, first, second } = geometry(settings);
    // A gradient at angle a draws lines perpendicular to it, so the first set (horizontal before
    // rotation) uses the rotation itself and the second set the rotation plus 90 degrees.
    const lines = (angle: number, color: string) =>
      `repeating-linear-gradient(${angle % 360}deg, ${color} 0 ${stroke}px, transparent ${stroke}px ${spacing}px)`;
    return [
      `  background-color: ${settings.background};`,
      `  background-image: ${lines(settings.rotation, first)}, ${lines(settings.rotation + 90, second)};`,
    ].join("\n");
  },
};
