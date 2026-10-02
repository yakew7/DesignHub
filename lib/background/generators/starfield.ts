import { createRandom, pick, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Upper bound on star nodes, so dense skies stay light to render and export. */
const MAX_STARS = 1200;

/** Scattered stars of varied size and brightness on a dark gradient; the brightest get a soft glow. */
export const starfield: BackgroundDefinition = {
  kind: "starfield",
  label: "Starfield",
  description: "Scattered stars on a dark sky, with a soft glow on the brightest.",
  defaults: { density: 50, scale: 1, background: "#05060f" },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    // Most stars are white; the palette tints the rest.
    const tints = ["#ffffff", "#ffffff", ...colors];
    const area = (width * height) / (1920 * 1080);
    const count = Math.min(MAX_STARS, Math.max(20, Math.round((80 + (density / 100) * 820) * area)));
    const base = Math.min(width, height) / 1080;

    // The sky: the canvas color darkening toward the top, plus a faint nebula at a seeded spot.
    const nebula = colors[1] ?? colors[0]!;
    const glowX = Math.round(range(random, 0.15, 0.85) * 100);
    const glowY = Math.round(range(random, 0.2, 0.7) * 100);
    const defs = [
      `<linearGradient id="star-sky" x1="0" y1="0" x2="0" y2="1">`,
      `<stop offset="0" stop-color="#000000" stop-opacity=".45"/>`,
      `<stop offset="1" stop-color="${colors[0]}" stop-opacity=".14"/>`,
      `</linearGradient>`,
      `<radialGradient id="star-nebula" cx="${glowX}%" cy="${glowY}%" r="55%">`,
      `<stop offset="0" stop-color="${nebula}" stop-opacity=".16"/>`,
      `<stop offset="1" stop-color="${nebula}" stop-opacity="0"/>`,
      `</radialGradient>`,
      `<radialGradient id="star-glow"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`,
    ].join("");

    const stars: string[] = [];
    const glows: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const x = r1(random() * width);
      const y = r1(random() * height);
      // Squaring skews the distribution: many faint pinpricks, a few bright stars.
      const size = random() ** 2;
      const r = r1(Math.max(0.4, (0.5 + size * 2.2) * base * scale));
      const opacity = (0.35 + size * 0.65).toFixed(2);
      const color = pick(random, tints);
      stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="${opacity}"/>`);
      // Glows share one gradient, and only the brightest stars get one, so the node count stays bounded.
      if (size > 0.72 && glows.length < count * 0.04 + 2) {
        glows.push(`<circle cx="${x}" cy="${y}" r="${r1(r * 7)}" fill="url(#star-glow)"/>`);
      }
    }

    return wrapSvg(
      settings,
      `<rect width="${width}" height="${height}" fill="url(#star-sky)"/><rect width="${width}" height="${height}" fill="url(#star-nebula)"/>${glows.join("")}${stars.join("")}`,
      defs,
    );
  },
};
