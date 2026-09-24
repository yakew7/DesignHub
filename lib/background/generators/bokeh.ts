import { createRandom, pick, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Out-of-focus light circles: a blurred back layer and a crisper front layer. */
export const bokeh: BackgroundDefinition = {
  kind: "bokeh",
  label: "Bokeh",
  description: "Soft, out-of-focus circles of light.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    const base = Math.min(width, height);
    const count = Math.round(12 + (density / 100) * 48);
    const circle = (min: number, max: number, opacity: [number, number]) => {
      const r = r1(range(random, min, max) * base * scale);
      return `<circle cx="${r1(random() * width)}" cy="${r1(random() * height)}" r="${r}" fill="${pick(random, colors)}" fill-opacity="${range(random, opacity[0], opacity[1]).toFixed(2)}"/>`;
    };
    const back = Array.from({ length: Math.round(count * 0.45) }, () => circle(0.08, 0.2, [0.25, 0.55])).join("");
    const front = Array.from({ length: count }, () => circle(0.015, 0.07, [0.2, 0.7])).join("");
    const blur = r1(base * 0.03 * scale);
    const defs = `<filter id="bokeh-far" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter>
      <filter id="bokeh-near" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1(blur * 0.18)}"/></filter>`;
    return wrapSvg(settings, `<g filter="url(#bokeh-far)">${back}</g><g filter="url(#bokeh-near)">${front}</g>`, defs);
  },
};
