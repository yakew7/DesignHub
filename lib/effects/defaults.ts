import type { EffectSettingsMap } from "@/types/effects";

export const effectDefaults: EffectSettingsMap = {
  glass: {
    blur: 16,
    saturation: 160,
    tint: "#ffffff",
    opacity: 0.12,
    borderOpacity: 0.25,
    shadowOpacity: 0.25,
    radius: 20,
  },
  neumorphism: { color: "#e0e5ec", depth: 12, blur: 24, intensity: 0.18, lightAngle: 315, radius: 24, shape: "flat" },
  shadow: {
    radius: 16,
    layers: [
      { id: "s1", x: 0, y: 1, blur: 2, spread: 0, color: "#000000", opacity: 0.08, inset: false },
      { id: "s2", x: 0, y: 8, blur: 24, spread: -4, color: "#000000", opacity: 0.18, inset: false },
    ],
  },
  inset: { x: 0, y: 2, blur: 6, spread: 0, color: "#000000", opacity: 0.18, fill: "#f4f4f5", radius: 12 },
  glow: { color: "#6366f1", radius: 32, intensity: 0.7, text: false, radiusCorner: 16 },
  border: {
    colors: ["#6366f1", "#f472b6", "#fbbf24"],
    fill: "#18181b",
    thickness: 2,
    radius: 16,
    angle: 135,
    animated: false,
    speed: 4,
  },
  grain: { scale: 180, opacity: 0.25, frequency: 0.8, blend: "overlay" },
  "long-shadow": { angle: 45, length: 48, color: "#312e81", fade: 0.6, target: "box", fill: "#6366f1", radius: 12 },
};
