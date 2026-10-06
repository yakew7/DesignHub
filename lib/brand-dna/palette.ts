import { colorDistance, fromHex, toHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";

export type WeightedColor = { color: Oklch; weight: number };

/** Colors closer than this (OKLab distance) to the background count as background. */
const BACKGROUND_DISTANCE = 0.08;

/**
 * The flat background of an image, if it has one: the most common color around the outer
 * edge, when it covers at least 60% of that ring. Photos and full-bleed art return null.
 */
export function detectBackground(pixels: Uint8ClampedArray, width: number, height: number, ring = 3): Oklch | null {
  const counts = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onEdge = x < ring || y < ring || x >= width - ring || y >= height - ring;
      if (!onEdge) continue;
      const i = (y * width + x) * 4;
      if ((pixels[i + 3] ?? 0) < 128) continue;
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bucket = counts.get(key);
      if (bucket) {
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.n += 1;
      } else counts.set(key, { r, g, b, n: 1 });
      total += 1;
    }
  }
  if (total === 0) return null;
  const top = [...counts.values()].sort((a, b) => b.n - a.n)[0];
  if (!top || top.n / total < 0.6) return null;
  const channel = (sum: number) =>
    Math.round(sum / top.n)
      .toString(16)
      .padStart(2, "0");
  return fromHex(`#${channel(top.r)}${channel(top.g)}${channel(top.b)}`);
}

/** One image's pixels for a combined palette. */
export type PixelSet = {
  pixels: Uint8ClampedArray;
  /** Relative share of the result, usually the image's area. Defaults to 1. */
  weight?: number;
  /** A color to leave out, such as the detected background. */
  exclude?: Oklch | null;
};

/** A color bucket: its averaged RGB and its share of the (combined) image. */
export type BucketShare = { key: number; r: number; g: number; b: number; share: number };

const hexFromRgb = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

/**
 * Buckets one image's opaque pixels (5 bits per channel) as fractions of the pixels kept.
 * The excluded color is left out, unless it is all there is (a blank canvas).
 */
function bucketShares(pixels: Uint8ClampedArray, exclude?: Oklch | null): BucketShare[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] ?? 0;
    if (alpha < 128) continue;
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else buckets.set(key, { r, g, b, n: 1 });
  }
  const all = [...buckets].map(([key, bucket]) => ({
    key,
    r: bucket.r / bucket.n,
    g: bucket.g / bucket.n,
    b: bucket.b / bucket.n,
    n: bucket.n,
  }));
  const kept = exclude
    ? all.filter((item) => colorDistance(fromHex(hexFromRgb(item.r, item.g, item.b)), exclude) >= BACKGROUND_DISTANCE)
    : all;
  const used = kept.length > 0 ? kept : all;
  const total = used.reduce((sum, item) => sum + item.n, 0) || 1;
  return used.map(({ key, r, g, b, n }) => ({ key, r, g, b, share: n / total }));
}

/**
 * Merges several images' buckets into one set. Each image counts in proportion to its
 * weight (its area) whatever its pixel count, and buckets shared by several images average
 * their color. Sorted by share with ties broken by key, so input order never matters.
 */
export function mergePixelSets(sets: PixelSet[]): BucketShare[] {
  const weights = sets.map((set) => Math.max(0, set.weight ?? 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const merged = new Map<number, BucketShare>();
  sets.forEach((set, index) => {
    const factor = (weights[index] ?? 0) / totalWeight;
    for (const item of bucketShares(set.pixels, set.exclude)) {
      const share = item.share * factor;
      if (share === 0) continue;
      // Channels are summed weighted by share here and divided back out below.
      const bucket = merged.get(item.key);
      if (bucket) {
        bucket.r += item.r * share;
        bucket.g += item.g * share;
        bucket.b += item.b * share;
        bucket.share += share;
      } else merged.set(item.key, { key: item.key, r: item.r * share, g: item.g * share, b: item.b * share, share });
    }
  });
  return [...merged.values()]
    .map((item) => ({ ...item, r: item.r / item.share, g: item.g / item.share, b: item.b / item.share }))
    .sort((a, b) => b.share - a.share || a.key - b.key);
}

/**
 * Dominant colors across one or more images: merge their buckets, then keep the most
 * common ones that are perceptually distinct. Fast enough to run on every upload.
 */
export function extractCombinedPalette(sets: PixelSet[], count = 5): WeightedColor[] {
  const ranked = mergePixelSets(sets)
    .slice(0, 256)
    .map((item) => ({ color: fromHex(hexFromRgb(item.r, item.g, item.b)), weight: item.share }));
  if (ranked.length === 0) return [];
  // Weigh what is left (after any excluded background) as the whole image.
  const kept = ranked.reduce((sum, item) => sum + item.weight, 0) || 1;
  ranked.forEach((item) => (item.weight /= kept));

  const picked: WeightedColor[] = [];
  for (const candidate of ranked) {
    const near = picked.find((item) => colorDistance(item.color, candidate.color) < 0.12);
    if (near) near.weight += candidate.weight;
    else if (picked.length < count) picked.push({ color: candidate.color, weight: candidate.weight });
  }
  // A logo on white is mostly white; make sure the colorful part is represented.
  const vivid = ranked.find(
    (item) => item.color.c > 0.08 && !picked.some((p) => colorDistance(p.color, item.color) < 0.12),
  );
  if (vivid && !picked.some((item) => item.color.c > 0.08)) {
    picked[picked.length - 1] = { color: vivid.color, weight: vivid.weight };
  }
  return picked.sort((a, b) => b.weight - a.weight);
}

/** Dominant colors of a single image. See `extractCombinedPalette`. */
export function extractPalette(
  pixels: Uint8ClampedArray,
  count = 5,
  options: { exclude?: Oklch | null } = {},
): WeightedColor[] {
  return extractCombinedPalette([{ pixels, exclude: options.exclude }], count);
}

export const hexOf = (color: Oklch) => toHex({ ...color, alpha: 1 });
