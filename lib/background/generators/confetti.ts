import { createRandom, pick, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

type Shape = "rect" | "circle" | "triangle" | "squiggle";
const shapes: Shape[] = ["rect", "rect", "circle", "triangle", "squiggle"];

/** Scattered, rotated little shapes in the palette colors. */
export const confetti: BackgroundDefinition = {
  kind: "confetti",
  label: "Confetti",
  description: "Scattered celebratory shapes.",
  defaults: { density: 40, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    const count = Math.round((60 + (density / 100) * 260) * ((width * height) / (1920 * 1080)));
    const items = Array.from({ length: Math.max(10, count) }, () => {
      const x = r1(random() * width);
      const y = r1(random() * height);
      const size = r1(range(random, 14, 38) * scale);
      const angle = Math.round(random() * 360);
      const color = pick(random, colors);
      const kind = pick(random, shapes);
      const at = `transform="translate(${x} ${y}) rotate(${angle})"`;
      if (kind === "circle") return `<circle ${at} r="${r1(size * 0.4)}" fill="${color}"/>`;
      if (kind === "triangle")
        return `<path ${at} d="M0 ${r1(-size * 0.55)}L${r1(size * 0.5)} ${r1(size * 0.4)}L${r1(-size * 0.5)} ${r1(size * 0.4)}Z" fill="${color}"/>`;
      if (kind === "squiggle")
        return `<path ${at} d="M${r1(-size)} 0q${r1(size / 2)} ${r1(-size / 2)} ${size} 0t${size} 0" fill="none" stroke="${color}" stroke-width="${r1(size * 0.22)}" stroke-linecap="round"/>`;
      return `<rect ${at} x="${r1(-size / 2)}" y="${r1(-size / 4)}" width="${size}" height="${r1(size / 2)}" rx="${r1(size * 0.08)}" fill="${color}"/>`;
    });
    return wrapSvg(settings, items.join(""));
  },
};
