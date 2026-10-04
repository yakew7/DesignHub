import { hexToRgba, px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { LongShadowSettings } from "@/types/effects";

/** More steps than this make the CSS long and slow to paint without looking any smoother. */
export const LONG_SHADOW_MAX_STEPS = 60;

/** Rounds first, so cos(90deg) comes out as 0 rather than a tiny number, and never as -0. */
const offset = (value: number) => px(Math.round(value * 100) / 100 || 0);

/**
 * Hard-edged shadow copies, one every pixel (or further apart once the length passes 60px),
 * stepping out along the angle. With fade, the copies get more transparent toward the far end.
 */
export function longShadowSteps(s: Pick<LongShadowSettings, "angle" | "length" | "color" | "fade">): string {
  const length = Math.max(0, s.length);
  const steps = Math.min(LONG_SHADOW_MAX_STEPS, Math.max(1, Math.round(length)));
  const radians = (s.angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const fade = Math.min(1, Math.max(0, s.fade));
  return Array.from({ length: steps }, (_, index) => {
    const step = index + 1;
    const distance = (length * step) / steps;
    const alpha = 1 - (fade * index) / steps;
    return `${offset(dx * distance)} ${offset(dy * distance)} 0 ${hexToRgba(s.color, alpha)}`;
  }).join(", ");
}

/** The flat-design long shadow, on a box (box-shadow) or on text (text-shadow). */
export const longShadow = defineEffect({
  kind: "long-shadow",
  label: "Long shadow",
  description: "Flat-design shadows that run out at an angle, for boxes and text.",
  generate(s) {
    const shadow = longShadowSteps(s);
    if (s.target === "text") return { declarations: [{ property: "text-shadow", value: shadow }] };
    return {
      declarations: [
        { property: "background-color", value: s.fill },
        { property: "border-radius", value: px(s.radius) },
        { property: "box-shadow", value: shadow },
      ],
    };
  },
});
