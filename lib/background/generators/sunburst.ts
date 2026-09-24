import { colorRamp } from "@/lib/background/palette";
import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const random = createRandom(settings.seed);
  const rays = 2 * Math.round(6 + (settings.density / 100) * 18);
  const cx = range(random, 0.25, 0.75);
  const cy = range(random, 0.55, 1.1);
  return { rays, cx, cy };
}

/** Alternating rays fanning out from a seeded point near the bottom of the canvas. */
export const sunburst: BackgroundDefinition = {
  kind: "sunburst",
  label: "Sunburst",
  description: "Radiating rays, retro poster style.",
  defaults: { density: 35, scale: 1 },
  render(settings) {
    const { width, height, scale } = settings;
    const { rays, cx, cy } = geometry(settings);
    const x = cx * width;
    const y = cy * height;
    const reach = Math.hypot(width, height) * 1.5;
    const colors = colorRamp(settings.colors, Math.max(2, Math.ceil(rays / 2)));
    const wedge = (Math.PI * 2) / rays;
    const paths = Array.from({ length: rays / 2 }, (_, i) => {
      const a = i * 2 * wedge;
      const b = a + wedge;
      return `<path d="M${r1(x)} ${r1(y)}L${r1(x + Math.cos(a) * reach)} ${r1(y + Math.sin(a) * reach)}L${r1(x + Math.cos(b) * reach)} ${r1(y + Math.sin(b) * reach)}Z" fill="${colors[i % colors.length]}"/>`;
    }).join("");
    // A small disc at the source hides the point where every ray meets.
    const disc = Math.min(width, height) * 0.06 * scale;
    return wrapSvg(
      settings,
      `${paths}<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(disc)}" fill="${settings.background}"/>`,
    );
  },
  css(settings) {
    const { rays, cx, cy } = geometry(settings);
    const first = settings.colors[0] ?? "#ffffff";
    const step = r1(360 / rays);
    return [
      `  background-color: ${settings.background};`,
      `  background-image: repeating-conic-gradient(from 0deg at ${Math.round(cx * 100)}% ${Math.round(cy * 100)}%, ${first} 0 ${step}deg, transparent ${step}deg ${r1(step * 2)}deg);`,
    ].join("\n");
  },
};
