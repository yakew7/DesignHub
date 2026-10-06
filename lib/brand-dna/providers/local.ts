import { detectBackground, extractCombinedPalette, hexOf, type WeightedColor } from "@/lib/brand-dna/palette";
import {
  MAX_DNA_IMAGES,
  type BrandDna,
  type BrandDnaProvider,
  type DnaColor,
  type DnaOptions,
} from "@/lib/brand-dna/types";

type Mood = { id: string; personality: string[]; heading: string; body: string; radius: number };

const moods: Record<string, Mood> = {
  vibrant: {
    id: "Vibrant",
    personality: ["Bold", "Energetic", "Playful"],
    heading: "Space Grotesk",
    body: "Inter",
    radius: 14,
  },
  calm: { id: "Calm", personality: ["Friendly", "Clear", "Warm"], heading: "Nunito", body: "Nunito Sans", radius: 16 },
  elegant: {
    id: "Elegant",
    personality: ["Refined", "Confident", "Timeless"],
    heading: "Playfair Display",
    body: "Source Sans 3",
    radius: 4,
  },
  technical: {
    id: "Technical",
    personality: ["Precise", "Reliable", "Direct"],
    heading: "IBM Plex Sans",
    body: "IBM Plex Sans",
    radius: 6,
  },
  minimal: { id: "Minimal", personality: ["Clear", "Honest", "Focused"], heading: "Inter", body: "Inter", radius: 8 },
};

function readMood(colors: WeightedColor[]): Mood {
  const chromatic = colors.filter((item) => item.color.c >= 0.05);
  const chroma = chromatic.reduce((sum, item) => sum + item.color.c * item.weight, 0);
  const lightness = colors.reduce((sum, item) => sum + item.color.l * item.weight, 0);
  const hue = chromatic[0]?.color.h ?? 0;
  if (chromatic.length === 0) return moods.minimal!;
  if (chroma > 0.08) return moods.vibrant!;
  if (lightness < 0.35) return moods.elegant!;
  if (hue > 180 && hue < 270) return moods.technical!;
  return moods.calm!;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

/** Heuristic analysis that never leaves the browser. */
export const localProvider: BrandDnaProvider = {
  id: "local",
  label: "On-device",
  description:
    "Extracts the palette and suggests type, radius and personality with simple heuristics. Free, private, instant.",
  local: true,
  mocked: false,
  async analyze(images, options: DnaOptions = {}) {
    const { signal, onStage, ignoreBackground = true } = options;
    if (images.length === 0) throw new Error("Add an image to analyze.");
    if (images.length > MAX_DNA_IMAGES) throw new Error(`Combine at most ${MAX_DNA_IMAGES} images.`);
    onStage?.("reading");
    await wait(120, signal);
    onStage?.("palette");
    // Each image keeps its own background handling and counts by its area.
    const backgrounds = images.map((image) =>
      (image.ignoreBackground ?? ignoreBackground)
        ? detectBackground(image.pixels, image.sampleWidth, image.sampleHeight)
        : null,
    );
    // An image that is nothing but its background (a blank canvas) still counts as that color.
    const palette = extractCombinedPalette(
      images.map((image, i) => ({ pixels: image.pixels, weight: image.width * image.height, exclude: backgrounds[i] })),
      6,
    );
    if (palette.length === 0)
      throw new Error(images.length > 1 ? "The images are fully transparent." : "The image is fully transparent.");
    await wait(160, signal);
    onStage?.("mood");
    const mood = readMood(palette);
    await wait(160, signal);
    onStage?.("type");
    await wait(120, signal);

    // Most colorful becomes primary, the next secondary, grays are neutrals.
    const byChroma = [...palette].sort((a, b) => b.color.c - a.color.c);
    const primary = byChroma[0];
    const secondary = byChroma.find((item) => item !== primary && item.color.c >= 0.05);
    const colors: DnaColor[] = palette.map((item) => ({
      hex: hexOf(item.color),
      weight: item.weight,
      role:
        item === primary ? "primary" : item === secondary ? "secondary" : item.color.c < 0.05 ? "neutral" : "secondary",
    }));
    const sampled = images.reduce((sum, image) => sum + image.sampleWidth * image.sampleHeight, 0);
    const left = [...new Set(backgrounds.flatMap((background) => (background ? [hexOf(background)] : [])))];
    const result: BrandDna = {
      colors,
      heading: mood.heading,
      body: mood.body,
      personality: mood.personality,
      mood: mood.id,
      radius: mood.radius,
      confidence: Math.min(0.9, 0.45 + palette.length * 0.07),
      notes: [
        `${palette.length} distinct colors found in ${sampled} sampled pixels${
          images.length > 1 ? ` across ${images.length} images, weighted by area` : ""
        }.`,
        `Mood reads as ${mood.id.toLowerCase()} from overall chroma and lightness.`,
        ...(left.length > 0
          ? [`Left out the ${left.join(", ")} ${left.length > 1 ? "backgrounds" : "background"}.`]
          : []),
      ],
    };
    onStage?.("done");
    return result;
  },
};
