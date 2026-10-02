import { spacingFor } from "@/lib/background/pattern";
import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const spacing = r1(spacingFor(settings.density, 1, 96, 18));
  // Scale sets the arm length (half the plus width), capped so neighbours never touch.
  const arm = r1(Math.min(spacing * 0.45, Math.max(2, spacing * 0.14 * settings.scale)));
  const thickness = r1(Math.max(1, arm * 0.36));
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  return { spacing, arm, thickness, first: colors[0]!, second: colors[1] ?? colors[0]! };
}

function plusPath(cx: number, cy: number, arm: number, thickness: number): string {
  const half = thickness / 2;
  return `M${r1(cx - arm)} ${r1(cy - half)}H${r1(cx + arm)}V${r1(cy + half)}H${r1(cx - arm)}ZM${r1(cx - half)} ${r1(cy - arm)}H${r1(cx + half)}V${r1(cy + arm)}H${r1(cx - half)}Z`;
}

/** A grid of small plus signs; the second color fills every other one in a checkerboard. */
export const plus: BackgroundDefinition = {
  kind: "plus",
  label: "Plus",
  description: "Grid of small plus signs, a subtle backdrop.",
  defaults: { density: 50, scale: 1 },
  render(settings) {
    const { spacing, arm, thickness, first, second } = geometry(settings);
    const tileSize = r1(spacing * 2);
    // The seed shifts where the grid starts, so different seeds don't all line up.
    const random = createRandom(settings.seed);
    const offsetX = r1(random() * tileSize);
    const offsetY = r1(random() * tileSize);
    const at = (column: number, row: number) =>
      plusPath((column + 0.5) * spacing, (row + 0.5) * spacing, arm, thickness);
    const tile = [
      `<path d="${at(0, 0)}${at(1, 1)}" fill="${first}"/>`,
      `<path d="${at(1, 0)}${at(0, 1)}" fill="${second}"/>`,
    ].join("");
    const defs = `<pattern id="plus" x="${offsetX}" y="${offsetY}" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse">${tile}</pattern>`;
    return wrapSvg(settings, `<rect width="${settings.width}" height="${settings.height}" fill="url(#plus)"/>`, defs);
  },
};
