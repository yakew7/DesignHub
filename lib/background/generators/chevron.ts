import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { r1 } from "@/lib/background/random";
import type { BackgroundDefinition } from "@/types/background";

/** Zigzag chevron rows alternating between the first two colors. */
export const chevron: BackgroundDefinition = {
  kind: "chevron",
  label: "Chevron",
  description: "Zigzag rows, bold and energetic.",
  defaults: { density: 30, scale: 1 },
  render(settings) {
    const w = r1(spacingFor(settings.density, settings.scale, 160, 28));
    const h = r1(w / 2);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    const first = colors[0]!;
    const second = colors[1] ?? first;
    const stroke = r1(h * 0.34);
    const zig = (y: number, color: string) =>
      `<path d="M${r1(-w / 2)} ${r1(y + h / 2)}L0 ${r1(y)}L${r1(w / 2)} ${r1(y + h / 2)}L${w} ${r1(y)}L${r1(w * 1.5)} ${r1(y + h / 2)}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="miter"/>`;
    // Two rows per tile, each drawn a little past the edges so the joins stay seamless.
    const tile = zig(h * 0.25, first) + zig(h * 1.25, second) + zig(h * 2.25, first);
    return patternSvg(settings, w, h * 2, tile);
  },
};
