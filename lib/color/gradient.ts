import { formatColor, oklch, toHex } from "@/lib/color/color";
import { OKLab, OKLCH, sRGB, to } from "@/lib/color/engine";
import { randomColor } from "@/lib/color/generate";
import { createId } from "@/lib/id";
import type { Gradient, GradientStop, Oklch } from "@/types/color";

export function createStop(color: Oklch, position: number): GradientStop {
  return { id: createId("stop"), color, position };
}

export const defaultGradient: Gradient = {
  type: "linear",
  angle: 135,
  x: 50,
  y: 50,
  interpolation: "oklch",
  stops: [
    createStop(oklch(0.62, 0.2, 277), 0),
    createStop(oklch(0.72, 0.17, 350), 50),
    createStop(oklch(0.85, 0.15, 85), 100),
  ],
};

export function sortedStops(gradient: Gradient): GradientStop[] {
  return [...gradient.stops].sort((a, b) => a.position - b.position);
}

function stopList(gradient: Gradient, useModern: boolean): string {
  return sortedStops(gradient)
    .map((stop) => `${useModern ? formatColor(stop.color, "oklch") : toHex(stop.color)} ${Math.round(stop.position)}%`)
    .join(", ");
}

function prefix(gradient: Gradient, interpolation: string): string {
  const space = interpolation ? `in ${interpolation}` : "";
  switch (gradient.type) {
    case "linear":
      return [space, `${Math.round(gradient.angle)}deg`].filter(Boolean).join(" ");
    case "radial":
      return [`circle at ${gradient.x}% ${gradient.y}%`, space].filter(Boolean).join(" ");
    case "conic":
      return [`from ${Math.round(gradient.angle)}deg at ${gradient.x}% ${gradient.y}%`, space]
        .filter(Boolean)
        .join(" ");
  }
}

/** Modern CSS with an explicit interpolation color space (CSS Color 4). */
export function gradientCss(gradient: Gradient): string {
  const interpolation = gradient.interpolation === "srgb" ? "" : gradient.interpolation;
  return `${gradient.type}-gradient(${prefix(gradient, interpolation)}, ${stopList(gradient, true)})`;
}

/** sRGB hex fallback for older browsers. */
export function gradientCssFallback(gradient: Gradient): string {
  return `${gradient.type}-gradient(${prefix(gradient, "")}, ${stopList(gradient, false)})`;
}

export function gradientFromColors(colors: Oklch[], base: Gradient): Gradient {
  const count = Math.max(colors.length, 2);
  return {
    ...base,
    stops: colors.slice(0, 6).map((color, index) => createStop(color, (index / (Math.min(count, 6) - 1)) * 100)),
  };
}

export function randomGradient(base: Gradient, random: () => number = Math.random): Gradient {
  const hue = random() * 360;
  const count = 2 + Math.floor(random() * 2);
  const colors = Array.from({ length: count }, (_, index) => randomColor(random, hue + index * (40 + random() * 60)));
  return { ...gradientFromColors(colors, base), angle: Math.round(random() * 36) * 10 };
}

type Coords = [number, number, number];

const spaces = { oklab: OKLab, srgb: sRGB } as const;

/** Below this chroma a hue is powerless (CSS Color 4) and takes the other stop's hue. */
const ACHROMATIC = 0.0001;

function mixOklch(left: Oklch, right: Oklch, t: number): Oklch {
  const leftHue = left.c < ACHROMATIC ? right.h : left.h;
  const rightHue = right.c < ACHROMATIC ? leftHue : right.h;
  // CSS takes the shorter way around the hue circle by default.
  let hueDelta = rightHue - leftHue;
  if (hueDelta > 180) hueDelta -= 360;
  if (hueDelta < -180) hueDelta += 360;
  return oklch(
    left.l + (right.l - left.l) * t,
    left.c + (right.c - left.c) * t,
    leftHue + hueDelta * t,
    left.alpha + (right.alpha - left.alpha) * t,
  );
}

/** Mixes two colors the way a CSS gradient does in OKLab or (gamma-encoded) sRGB. */
function mixIn(space: keyof typeof spaces, left: Oklch, right: Oklch, t: number): Oklch {
  const coords = (color: Oklch): Coords => {
    const [a, b, c] = to({ space: OKLCH, coords: [color.l, color.c, color.h], alpha: 1 }, spaces[space]).coords;
    return [a ?? 0, b ?? 0, c ?? 0];
  };
  const a = coords(left);
  const b = coords(right);
  const mixed: Coords = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const [l, c, h] = to({ space: spaces[space], coords: mixed, alpha: 1 }, OKLCH).coords;
  return oklch(l ?? 0, c ?? 0, h ?? 0, left.alpha + (right.alpha - left.alpha) * t);
}

/** Color at a position (0-100), interpolating the neighbouring stops in the gradient's color space. */
export function colorAt(gradient: Gradient, position: number): Oklch {
  const stops = sortedStops(gradient);
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return oklch(0.5, 0, 0);
  if (position <= first.position) return first.color;
  if (position >= last.position) return last.color;
  const index = stops.findIndex((stop) => stop.position >= position);
  const right = stops[index] ?? last;
  const left = stops[index - 1] ?? first;
  const t = (position - left.position) / Math.max(right.position - left.position, 0.0001);
  return gradient.interpolation === "oklch"
    ? mixOklch(left.color, right.color, t)
    : mixIn(gradient.interpolation, left.color, right.color, t);
}
