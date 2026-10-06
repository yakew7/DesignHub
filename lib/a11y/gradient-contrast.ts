import { contrastRatio, oklch, parseColor, toHex } from "@/lib/color/color";
import { colorAt, gradientCss, sortedStops } from "@/lib/color/gradient";
import type { Gradient } from "@/types/color";

/** 64 even steps along the gradient line, so 65 points including both ends. */
export const GRADIENT_SAMPLES = 65;

/** Normal-size text needs 4.5:1 (WCAG 1.4.3); large text 3:1. */
const REQUIRED = 4.5;
const REQUIRED_LARGE = 3;

export type GradientTextColor = { id: "white" | "black" | "brand"; label: string; color: string };

export type GradientTextResult = GradientTextColor & {
  /** Lowest contrast found anywhere along the gradient. */
  worstRatio: number;
  /** Where that is, in % along the gradient line (0 is the first stop's end). */
  worstPosition: number;
  /** The gradient color at that point. */
  worstBackground: string;
  required: number;
  pass: boolean;
  passLarge: boolean;
};

/** White, black and the brand's own text color. */
export function gradientTextColors(brandText: string): GradientTextColor[] {
  return [
    { id: "white", label: "White", color: "#ffffff" },
    { id: "black", label: "Black", color: "#000000" },
    { id: "brand", label: "Brand text", color: brandText },
  ];
}

/** Evenly spaced positions over the stops' range, always at least 32 of them. */
export function samplePositions(gradient: Gradient, samples = GRADIENT_SAMPLES): number[] {
  const stops = sortedStops(gradient);
  const start = Math.min(0, stops[0]?.position ?? 0);
  const end = Math.max(100, stops[stops.length - 1]?.position ?? 100);
  const count = Math.max(32, Math.round(samples));
  return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
}

/**
 * Text can sit anywhere on the gradient (a banner title spans most of it), so every color is
 * checked against points sampled in the gradient's own interpolation space, and the lowest
 * contrast is what counts. Stops are sampled too, since a stop is often the extreme.
 */
export function gradientTextContrast(
  gradient: Gradient,
  colors: GradientTextColor[],
  samples = GRADIENT_SAMPLES,
): GradientTextResult[] {
  const positions = [...new Set([...samplePositions(gradient, samples), ...gradient.stops.map((s) => s.position)])];
  const points = positions.sort((a, b) => a - b).map((position) => ({ position, color: colorAt(gradient, position) }));

  return colors.map((text) => {
    const fg = parseColor(text.color) ?? oklch(0, 0, 0);
    let worst = { ratio: Infinity, position: 0, background: points[0]?.color ?? oklch(1, 0, 0) };
    for (const point of points) {
      const ratio = contrastRatio(fg, point.color);
      if (ratio < worst.ratio) worst = { ratio, position: point.position, background: point.color };
    }
    const worstRatio = Number.isFinite(worst.ratio) ? worst.ratio : 1;
    return {
      ...text,
      worstRatio,
      worstPosition: Math.round(worst.position * 10) / 10,
      worstBackground: toHex(worst.background),
      required: REQUIRED,
      pass: worstRatio >= REQUIRED,
      passLarge: worstRatio >= REQUIRED_LARGE,
    };
  });
}

const truncate = (value: number) => Math.floor(value * 100) / 100;

export function gradientSection(gradient: Gradient, results: GradientTextResult[], samples = GRADIENT_SAMPLES) {
  return {
    check: "Text on the brand gradient (1.4.3)",
    gradient: gradientCss(gradient),
    interpolation: gradient.interpolation,
    samples: Math.max(32, Math.round(samples)),
    results: results.map((item) => ({
      text: item.label,
      color: item.color,
      worstRatio: truncate(item.worstRatio),
      worstPosition: item.worstPosition,
      worstBackground: item.worstBackground,
      required: item.required,
      pass: item.pass,
      passLarge: item.passLarge,
    })),
  };
}
