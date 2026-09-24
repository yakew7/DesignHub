import type { FontFamily } from "@/types/typography";

/** The weight a font can actually show for a requested one: clamped to its wght axis, or the closest static weight. */
export function nearestWeight(font: FontFamily | undefined, weight: number): number {
  if (!font) return weight;
  const axis = font.axes?.find((item) => item.tag === "wght");
  if (axis) return Math.min(axis.max, Math.max(axis.min, weight));
  if (font.weights.length === 0 || font.weights.includes(weight)) return weight;
  return font.weights.reduce((best, item) => (Math.abs(item - weight) < Math.abs(best - weight) ? item : best));
}

/** A second font to start comparing with: the first of the pairing fonts that differs from the active one. */
export function defaultCompareFont(active: string, candidates: string[]): string {
  return candidates.find((family) => family !== active) ?? (active === "Roboto" ? "Inter" : "Roboto");
}
