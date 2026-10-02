import { oklch, parseColor, toHex } from "@/lib/color/color";
import { defineEffect } from "@/lib/effects/define";
import { px } from "@/lib/effects/css";

/** Shifts a color's OKLCH lightness by `delta`, clamped to 0-1. */
export function tone(hex: string, delta: number): string {
  const color = parseColor(hex) ?? oklch(0.9, 0.01, 250);
  return toHex(oklch(Math.min(1, Math.max(0, color.l + delta)), color.c, color.h));
}

/** Soft UI: one light and one dark shadow cast in opposite directions from a single light source. */
export const neumorphism = defineEffect({
  kind: "neumorphism",
  label: "Neumorphism",
  description: "Soft extruded surfaces lit from one direction.",
  generate(s) {
    // lightAngle: where the light comes from, 0° = top, clockwise. Shadows fall the opposite way.
    const radians = (s.lightAngle * Math.PI) / 180;
    const dx = Math.round(-Math.sin(radians) * s.depth);
    const dy = Math.round(Math.cos(radians) * s.depth);
    const amount = s.intensity * 0.8;
    const dark = tone(s.color, -amount);
    const light = tone(s.color, amount);
    const inset = s.shape === "pressed" ? "inset " : "";
    const shadow = `${inset}${px(dx)} ${px(dy)} ${px(s.blur)} ${dark}, ${inset}${px(-dx)} ${px(-dy)} ${px(s.blur)} ${light}`;

    const gradientAngle = (s.lightAngle + 180) % 360;
    const background =
      s.shape === "concave"
        ? `linear-gradient(${gradientAngle}deg, ${tone(s.color, amount * 0.35)}, ${tone(s.color, -amount * 0.35)})`
        : s.shape === "convex"
          ? `linear-gradient(${gradientAngle}deg, ${tone(s.color, -amount * 0.35)}, ${tone(s.color, amount * 0.35)})`
          : s.color;

    return {
      surface: s.color,
      declarations: [
        { property: "background", value: background },
        { property: "border-radius", value: px(s.radius) },
        { property: "box-shadow", value: shadow },
      ],
    };
  },
});
