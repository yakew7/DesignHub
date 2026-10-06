import { colorRamp } from "@/lib/background/palette";
import { spacingFor } from "@/lib/background/pattern";
import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

/** Dot colors are bucketed so every bucket is one path, which keeps the node count tiny. */
const SHADES = 12;
/** About the most dots drawn (plus the bleed rows), so huge canvases stay a few hundred KB. */
const MAX_DOTS = 6000;

export type HalftoneGradient = {
  type: "linear" | "radial";
  /** Gradient center in px. */
  cx: number;
  cy: number;
  /** Direction of a linear gradient, in radians. */
  angle: number;
};

/**
 * The seed moves the gradient center and turns a linear one. It also picks linear or radial,
 * unless the gradient option forces one; the draw is made either way, so forcing the type
 * keeps the same center and angle.
 */
export function halftoneGradient(settings: BackgroundSettings): HalftoneGradient {
  const random = createRandom(settings.seed);
  const seeded = random() < 0.5 ? "radial" : "linear";
  const choice = settings.options?.halftoneGradient ?? "seeded";
  return {
    type: choice === "seeded" ? seeded : choice,
    cx: range(random, 0.2, 0.8) * settings.width,
    cy: range(random, 0.2, 0.8) * settings.height,
    angle: random() * Math.PI * 2,
  };
}

/** Gradient strength at a point, from 1 (largest dots) down to 0 (no dot). */
export function halftoneStrength(gradient: HalftoneGradient, width: number, height: number) {
  const corners = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ] as const;
  if (gradient.type === "radial") {
    const reach = Math.max(...corners.map(([x, y]) => Math.hypot(x - gradient.cx, y - gradient.cy)));
    return (x: number, y: number) => Math.max(0, 1 - Math.hypot(x - gradient.cx, y - gradient.cy) / reach);
  }
  const dx = Math.cos(gradient.angle);
  const dy = Math.sin(gradient.angle);
  const along = (x: number, y: number) => (x - gradient.cx) * dx + (y - gradient.cy) * dy;
  // The center is the midpoint of the ramp; the farthest corner reaches 0 or 1.
  const reach = Math.max(...corners.map(([x, y]) => Math.abs(along(x, y))));
  return (x: number, y: number) => Math.min(1, Math.max(0, 0.5 + along(x, y) / (2 * reach)));
}

/** A staggered grid of dots whose size and color follow a linear or radial gradient. */
export const halftone: BackgroundDefinition = {
  kind: "halftone",
  label: "Halftone",
  description: "Print-style dots that grow along a linear or radial gradient.",
  defaults: { density: 50, scale: 1 },
  render(settings) {
    const { width, height } = settings;
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    // Density sets the grid pitch, widened when needed so huge canvases stay under MAX_DOTS.
    const spacing = Math.max(spacingFor(settings.density, 1, 56, 12), Math.sqrt((width * height) / (MAX_DOTS * 0.866)));
    const rowHeight = spacing * 0.866;
    // Scale sets the largest dot; from about 1.4 up the largest dots just close the gaps, like solid ink.
    const largest = spacing * 0.5 * Math.min(1.2, Math.max(0.2, settings.scale * 0.85));
    const strengthAt = halftoneStrength(halftoneGradient(settings), width, height);
    // Small dots take the second color, large ones the first.
    const shades = colorRamp([colors[1] ?? colors[0]!, colors[0]!], SHADES);
    const buckets: string[][] = shades.map(() => []);
    for (let row = -1; row * rowHeight <= height + rowHeight; row += 1) {
      const shift = Math.abs(row % 2) * (spacing / 2);
      for (let column = -1; column * spacing <= width + spacing; column += 1) {
        const x = column * spacing + shift;
        const y = row * rowHeight;
        const strength = strengthAt(x, y);
        const radius = r1(largest * strength);
        if (radius < 0.4) continue;
        // A circle as two arcs, so all dots of one shade share a single path.
        buckets[Math.min(SHADES - 1, Math.floor(strength * SHADES))]!.push(
          `M${r1(x - radius)} ${r1(y)}a${radius} ${radius} 0 1 0 ${r1(radius * 2)} 0a${radius} ${radius} 0 1 0 ${r1(-radius * 2)} 0`,
        );
      }
    }
    const body = buckets
      .map((dots, i) => (dots.length ? `<path d="${dots.join("")}" fill="${shades[i]}"/>` : ""))
      .join("");
    return wrapSvg(settings, body);
  },
};
