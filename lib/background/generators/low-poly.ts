import { colorRamp } from "@/lib/background/palette";
import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Jittered triangle mosaic shaded along a diagonal through the palette. */
export const lowPoly: BackgroundDefinition = {
  kind: "low-poly",
  label: "Low poly",
  description: "Faceted triangle mosaic, shaded across your palette.",
  defaults: { density: 40, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const cell = Math.max(40, (220 - (density / 100) * 170) * scale);
    const cols = Math.ceil(width / cell) + 1;
    const rows = Math.ceil(height / cell) + 1;
    const jitter = cell * 0.42;
    // Edge points stay on the edges so the mosaic always covers the canvas.
    const points = Array.from({ length: rows + 1 }, (_, y) =>
      Array.from({ length: cols + 1 }, (_, x) => {
        const edgeX = x === 0 || x === cols;
        const edgeY = y === 0 || y === rows;
        return [
          x * cell + (edgeX ? 0 : range(random, -jitter, jitter)),
          y * cell + (edgeY ? 0 : range(random, -jitter, jitter)),
        ] as const;
      }),
    );
    const ramp = colorRamp(settings.colors, 24);
    const shade = (px: number, py: number) => {
      const t = (px / (cols * cell) + py / (rows * cell)) / 2;
      const index = Math.round(Math.min(1, Math.max(0, t + range(random, -0.08, 0.08))) * (ramp.length - 1));
      return ramp[index]!;
    };
    const tri = (a: readonly number[], b: readonly number[], c: readonly number[]) => {
      const color = shade((a[0]! + b[0]! + c[0]!) / 3, (a[1]! + b[1]! + c[1]!) / 3);
      return `<path d="M${r1(a[0]!)} ${r1(a[1]!)}L${r1(b[0]!)} ${r1(b[1]!)}L${r1(c[0]!)} ${r1(c[1]!)}Z" fill="${color}" stroke="${color}" stroke-width=".6"/>`;
    };
    let out = "";
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const p00 = points[y]![x]!;
        const p10 = points[y]![x + 1]!;
        const p01 = points[y + 1]![x]!;
        const p11 = points[y + 1]![x + 1]!;
        // Alternate the split direction so the facets don't line up.
        if ((x + y) % 2 === 0) out += tri(p00, p10, p11) + tri(p00, p11, p01);
        else out += tri(p00, p10, p01) + tri(p10, p11, p01);
      }
    }
    return wrapSvg(settings, out);
  },
};
