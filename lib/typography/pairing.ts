import type { FontCategory, FontFamily } from "@/types/typography";

export type FontPair = {
  heading: string;
  body: string;
  note?: string;
};

/** Hand-picked pairings that are known to work well together. */
export const curatedPairs: FontPair[] = [
  { heading: "Space Grotesk", body: "Inter", note: "Technical, crisp product UI" },
  { heading: "Playfair Display", body: "Source Sans 3", note: "Classic editorial contrast" },
  { heading: "Fraunces", body: "Inter", note: "Warm, soft serif with neutral text" },
  { heading: "DM Serif Display", body: "DM Sans", note: "A superfamily done right" },
  { heading: "Instrument Serif", body: "Geist", note: "Modern luxury" },
  { heading: "Bricolage Grotesque", body: "Figtree", note: "Friendly and expressive" },
  { heading: "Libre Baskerville", body: "Montserrat", note: "Timeless with a geometric edge" },
  { heading: "Oswald", body: "Lato", note: "Condensed headlines, humanist text" },
  { heading: "Merriweather", body: "Open Sans", note: "Readable long-form" },
  { heading: "Bebas Neue", body: "Roboto", note: "Loud posters, calm body" },
  { heading: "Sora", body: "Manrope", note: "Web3-era geometric" },
  { heading: "Lora", body: "Nunito Sans", note: "Soft storytelling" },
  { heading: "Cormorant Garamond", body: "Proza Libre", note: "Refined literary" },
  { heading: "Archivo Black", body: "Archivo", note: "Bold single-family system" },
  { heading: "Syne", body: "Inter", note: "Art-direction statement" },
  { heading: "IBM Plex Serif", body: "IBM Plex Sans", note: "Corporate superfamily" },
  { heading: "Outfit", body: "Work Sans", note: "Clean SaaS marketing" },
  { heading: "Unbounded", body: "Plus Jakarta Sans", note: "Wide and confident" },
  { heading: "EB Garamond", body: "Karla", note: "Old style meets quirky grotesk" },
  { heading: "JetBrains Mono", body: "Inter", note: "Developer tooling" },
  { heading: "Montserrat", body: "Merriweather", note: "Geometric headlines, bookish text" },
  { heading: "Raleway", body: "Roboto", note: "Elegant display, familiar text" },
  { heading: "Rubik", body: "Karla", note: "Rounded and approachable" },
  { heading: "Crimson Pro", body: "Work Sans", note: "Scholarly and calm" },
  { heading: "Abril Fatface", body: "Poppins", note: "Fashion magazine" },
  { heading: "Nunito", body: "Nunito Sans", note: "Soft superfamily" },
  { heading: "Barlow Condensed", body: "Barlow", note: "Industrial and efficient" },
  { heading: "Zilla Slab", body: "Inter", note: "Slab-serif editorial" },
  { heading: "Roboto Slab", body: "Roboto", note: "Material classic" },
  { heading: "Alegreya", body: "Alegreya Sans", note: "Literary superfamily" },
  { heading: "Spectral", body: "Inter", note: "Screen-first serif" },
  { heading: "Red Hat Display", body: "Red Hat Text", note: "Enterprise superfamily" },
  { heading: "Lexend", body: "Atkinson Hyperlegible", note: "Readability first" },
  { heading: "Righteous", body: "Poppins", note: "Retro fun" },
  { heading: "Pacifico", body: "Quicksand", note: "Playful script" },
  { heading: "Caveat", body: "Nunito", note: "Handwritten and friendly" },
  { heading: "Space Mono", body: "Space Grotesk", note: "Retro-futurist tech" },
  { heading: "Geist", body: "Geist Mono", note: "Developer-grade minimal" },
  { heading: "Anton", body: "Roboto Condensed", note: "Sports and headlines" },
  { heading: "Libre Franklin", body: "Libre Caslon Text", note: "American newspaper" },
  { heading: "Manrope", body: "Newsreader", note: "Modern long-form news" },
  { heading: "Josefin Sans", body: "Lato", note: "Vintage geometric" },
];

const bodyCategories: FontCategory[] = ["sans-serif", "serif", "monospace"];

/** What tends to contrast well with a given heading category. */
const contrastScore: Record<FontCategory, Partial<Record<FontCategory, number>>> = {
  serif: { "sans-serif": 3, serif: 0.5, monospace: 1 },
  "sans-serif": { serif: 2.5, "sans-serif": 1.5, monospace: 1 },
  display: { "sans-serif": 3, serif: 1.5, monospace: 0.5 },
  handwriting: { "sans-serif": 3, serif: 1.5 },
  monospace: { "sans-serif": 3, serif: 1.5 },
};

/** A usable body font needs at least a regular and a bold weight. */
export function isBodyCandidate(font: FontFamily): boolean {
  if (!bodyCategories.includes(font.category)) return false;
  const hasRegular = font.weights.includes(400);
  const hasBold = font.weights.some((weight) => weight >= 600);
  return hasRegular && hasBold;
}

export function scoreBody(heading: FontFamily, body: FontFamily): number {
  if (heading.family === body.family) return -Infinity;
  const contrast = contrastScore[heading.category][body.category] ?? 0;
  const popularity = 1 - Math.min(body.rank, 500) / 500;
  const range = Math.min(body.weights.length, 9) / 9;
  const variable = body.axes?.length ? 0.3 : 0;
  // Fonts from the same superfamily usually harmonise.
  const sameFamily = heading.family.split(" ")[0] === body.family.split(" ")[0] ? 0.8 : 0;
  return contrast + popularity * 2 + range + variable + sameFamily;
}

export function suggestBodies(heading: FontFamily, fonts: FontFamily[], limit = 6): FontFamily[] {
  return fonts
    .filter(isBodyCandidate)
    .map((font) => ({ font, score: scoreBody(heading, font) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ font }) => font);
}

function pick<T>(items: T[], random: () => number): T | undefined {
  return items[Math.floor(random() * items.length)];
}

/**
 * Picks a random but sensible pairing. Locked sides are kept.
 * Draws from the 150 most popular families so results stay usable.
 */
export function randomPair(
  fonts: FontFamily[],
  current: FontPair,
  locks: { heading: boolean; body: boolean },
  random: () => number = Math.random,
): FontPair {
  const pool = fonts.filter((font) => font.rank <= 150);
  const headingPool = pool.filter((font) => font.category !== "monospace");
  const heading = locks.heading ? fonts.find((font) => font.family === current.heading) : pick(headingPool, random);
  if (!heading) return current;

  if (locks.body) return { heading: heading.family, body: current.body };
  const bodies = suggestBodies(heading, pool, 8);
  const body = pick(bodies, random);
  return { heading: heading.family, body: body?.family ?? current.body };
}
