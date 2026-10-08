import { colorDistance, oklch } from "@/lib/color/color";
import { OKLCH, sRGB_Linear, to, toGamut } from "@/lib/color/engine";
import type { Oklch } from "@/types/color";

export type VisionType = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

export const visionTypes: { value: VisionType; label: string; description: string }[] = [
  { value: "normal", label: "Typical vision", description: "No simulation." },
  { value: "protanopia", label: "Protanopia", description: "No red cones · ~1% of men" },
  { value: "deuteranopia", label: "Deuteranopia", description: "No green cones · ~1% of men" },
  { value: "tritanopia", label: "Tritanopia", description: "No blue cones · very rare" },
  { value: "achromatopsia", label: "Achromatopsia", description: "No color perception" },
];

type Matrix = [number, number, number, number, number, number, number, number, number];

/** Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear sRGB. */
export const visionMatrices: Record<Exclude<VisionType, "normal" | "achromatopsia">, Matrix> = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

export function simulateVision(color: Oklch, type: VisionType): Oklch {
  if (type === "normal") return color;
  const linear = to(
    toGamut({ space: OKLCH, coords: [color.l, color.c, color.h], alpha: 1 }, { space: "srgb" }),
    "srgb-linear",
  );
  const [r = 0, g = 0, b = 0] = linear.coords.map((value) => value ?? 0);

  let out: [number, number, number];
  if (type === "achromatopsia") {
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    out = [y, y, y];
  } else {
    const m = visionMatrices[type];
    out = [m[0] * r + m[1] * g + m[2] * b, m[3] * r + m[4] * g + m[5] * b, m[6] * r + m[7] * g + m[8] * b];
  }

  const clamped = out.map((value) => Math.min(1, Math.max(0, value))) as [number, number, number];
  const [l, c, h] = to({ space: sRGB_Linear, coords: clamped, alpha: 1 }, "oklch").coords;
  return oklch(l ?? 0, c ?? 0, h ?? 0, color.alpha);
}

/** OKLab distance (ΔE OK) between two colors as a person with `type` vision would see them. */
export function simulatedDistance(a: Oklch, b: Oklch, type: VisionType): number {
  return colorDistance(simulateVision(a, type), simulateVision(b, type));
}
