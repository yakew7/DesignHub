import { contrastRatio, oklch, parseColor, toHex } from "@/lib/color/color";
import { simulatedDistance, simulateVision, type VisionType } from "@/lib/color/vision";
import type { Oklch } from "@/types/color";
import type { A11yColors, VisionMode } from "@/types/a11y";

export const visionModes: { value: VisionMode; label: string; description: string }[] = [
  { value: "none", label: "Typical vision", description: "No simulation." },
  { value: "protanopia", label: "Protanopia", description: "No red cones. ~1% of men." },
  { value: "deuteranopia", label: "Deuteranopia", description: "No green cones. ~1% of men; the most common." },
  { value: "tritanopia", label: "Tritanopia", description: "No blue cones. Very rare." },
  { value: "grayscale", label: "Grayscale", description: "Achromatopsia, or a grayscale display." },
  {
    value: "low-vision",
    label: "Low vision",
    description: "Blur and reduced contrast, e.g. cataracts or a dim screen.",
  },
];

const simulationType: Partial<Record<VisionMode, VisionType>> = {
  protanopia: "protanopia",
  deuteranopia: "deuteranopia",
  tritanopia: "tritanopia",
  grayscale: "achromatopsia",
};

/** Contrast as a person with each deficiency would perceive it. Catches pairs that only differ in hue. */
export function visionSection(colors: A11yColors) {
  const pairs: [string, string, string][] = [
    ["Body text", colors.text, colors.background],
    ["Links", colors.accent, colors.background],
    ["Button label", colors.onAccent, colors.accent],
  ];
  return Object.entries(simulationType).map(([mode, type]) => ({
    mode,
    pairs: pairs.map(([label, fg, bg]) => {
      const foreground = parseColor(fg);
      const background = parseColor(bg);
      const ratio =
        foreground && background && type
          ? contrastRatio(simulateVision(foreground, type), simulateVision(background, type))
          : 0;
      return { check: label, ratio: Math.floor(ratio * 100) / 100, passAA: ratio >= 4.5 };
    }),
  }));
}

/** A named palette color, as the Color Studio swatches and brand roles describe it. */
export type PaletteColor = { name: string; hex: string };

/**
 * Minimum OKLab distance (ΔE OK) for two palette colors to read as different categories, as in
 * chart series or status colors. About three times the ~0.02 just-noticeable difference.
 */
export const DISTINGUISHABLE_THRESHOLD = 0.06;

export type LightnessSuggestion = {
  /** Name of the color to change. */
  color: string;
  from: string;
  to: string;
  /** Distance under this vision type after the change. */
  distance: number;
};

export type ConfusablePair = {
  a: PaletteColor;
  b: PaletteColor;
  /** ΔE OK under typical vision. */
  typicalDistance: number;
  /** ΔE OK after simulation, below the threshold. */
  distance: number;
  suggestion: LightnessSuggestion | null;
};

export type PaletteVisionMode = { mode: VisionMode; pass: boolean; pairs: ConfusablePair[] };

export type PaletteVisionSection = {
  threshold: number;
  colors: PaletteColor[];
  pass: boolean;
  modes: PaletteVisionMode[];
};

type ParsedColor = PaletteColor & { color: Oklch };

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/**
 * The smallest lightness change to one of the two colors that pulls them apart under `type`
 * without making them collide under typical vision. Tries both colors, away from the other first.
 */
export function suggestLightness(
  a: ParsedColor,
  b: ParsedColor,
  type: VisionType,
  threshold = DISTINGUISHABLE_THRESHOLD,
): LightnessSuggestion | null {
  for (let step = 1; step <= 50; step++) {
    const delta = step * 0.01;
    for (const [target, other] of [
      [a, b],
      [b, a],
    ]) {
      const away = target.color.l >= other.color.l ? 1 : -1;
      for (const sign of [away, -away]) {
        const l = target.color.l + sign * delta;
        if (l < 0 || l > 1) continue;
        const hex = toHex(oklch(l, target.color.c, target.color.h));
        // Measure the rounded hex so the suggestion passes exactly as it will be pasted.
        const changed = parseColor(hex);
        if (!changed) continue;
        const distance = simulatedDistance(changed, other.color, type);
        if (distance >= threshold && simulatedDistance(changed, other.color, "normal") >= threshold) {
          return { color: target.name, from: target.hex, to: hex, distance: round3(distance) };
        }
      }
    }
  }
  return null;
}

/**
 * Pairs of palette colors that are distinct under typical vision but fall below `threshold`
 * once each color vision deficiency is simulated, with a lightness fix for each.
 */
export function paletteVisionSection(
  palette: PaletteColor[],
  threshold = DISTINGUISHABLE_THRESHOLD,
): PaletteVisionSection {
  const colors: ParsedColor[] = palette.flatMap((entry) => {
    const color = parseColor(entry.hex);
    return color ? [{ ...entry, color }] : [];
  });
  const modes = (Object.entries(simulationType) as [VisionMode, VisionType][]).map(([mode, type]) => {
    const pairs: ConfusablePair[] = [];
    colors.forEach((a, i) => {
      for (const b of colors.slice(i + 1)) {
        const typicalDistance = simulatedDistance(a.color, b.color, "normal");
        // Pairs that already look alike to everyone are tints of one color, not a vision problem.
        if (typicalDistance < threshold) continue;
        const distance = simulatedDistance(a.color, b.color, type);
        if (distance >= threshold) continue;
        pairs.push({
          a: { name: a.name, hex: a.hex },
          b: { name: b.name, hex: b.hex },
          typicalDistance: round3(typicalDistance),
          distance: round3(distance),
          suggestion: suggestLightness(a, b, type, threshold),
        });
      }
    });
    return { mode, pass: pairs.length === 0, pairs };
  });
  return {
    threshold,
    colors: colors.map(({ name, hex }) => ({ name, hex })),
    pass: modes.every((mode) => mode.pass),
    modes,
  };
}
