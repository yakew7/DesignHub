import { colorRamp } from "@/lib/background/palette";
import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Concentric ripples spreading from two or three seeded centers. */
export const rings: BackgroundDefinition = {
  kind: "rings",
  label: "Rings",
  description: "Concentric ripples from a few seeded centers.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const centers = 2 + Math.floor(random() * 2);
    const step = Math.max(14, (110 - (density / 100) * 80) * scale);
    const reach = Math.hypot(width, height) * 0.75;
    const count = Math.min(90, Math.ceil(reach / step));
    const colors = colorRamp(settings.colors, count);
    const stroke = r1(Math.max(1.5, step * 0.14));
    const groups = Array.from({ length: centers }, (_, c) => {
      const cx = r1(range(random, 0.1, 0.9) * width);
      const cy = r1(range(random, 0.1, 0.9) * height);
      const circles = colors
        .map((color, i) => `<circle cx="${cx}" cy="${cy}" r="${r1(step * (i + 1))}" stroke="${color}"/>`)
        .join("");
      return `<g fill="none" stroke-width="${stroke}" stroke-opacity="${(0.85 - c * 0.2).toFixed(2)}">${circles}</g>`;
    });
    return wrapSvg(settings, groups.join(""));
  },
};
