import { hexToRgba, px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { LongShadowSettings } from "@/types/effects";

/** More steps than this make the CSS long and slow to paint without looking any smoother. */
export const LONG_SHADOW_MAX_STEPS = 60;

/** Rounds first, so cos(90deg) comes out as 0 rather than a tiny number, and never as -0. */
const offset = (value: number) => px(Math.round(value * 100) / 100 || 0);

/**
 * The opacity the shadow should show at each step, from the box or text edge (index 0) to the
 * tip: a straight ramp from 1 down to 1 - fade (minus one step, so the tip never vanishes).
 */
export function longShadowRamp(steps: number, fade: number): number[] {
  return Array.from({ length: steps }, (_, index) => 1 - (fade * index) / steps);
}

/**
 * Per-copy alphas that make stacked box shadows composite to `ramp`.
 *
 * On a box every copy covers the whole band behind the copies before it, so the band between
 * step i and step i + 1 is covered by copies i to the last, and its opacity is
 * 1 - (1 - a[i]) * ... * (1 - a[last]). Solving that for each copy from the tip back gives
 * a[i] = (ramp[i] - ramp[i + 1]) / (1 - ramp[i + 1]). Glyph strokes are thin, so text copies
 * barely overlap and use the ramp as is.
 */
export function compensatedAlphas(ramp: number[]): number[] {
  return ramp.map((target, index) => {
    const next = ramp[index + 1] ?? 0;
    // Where the copies behind are already opaque, this one's alpha doesn't change the result.
    return next >= 1 ? target : (target - next) / (1 - next);
  });
}

/** What a stack of copies with these alphas composites to at each step (the inverse of `compensatedAlphas`). */
export function compositedOpacity(alphas: number[]): number[] {
  let clear = 1;
  const opacity: number[] = [];
  for (let index = alphas.length - 1; index >= 0; index -= 1) {
    clear *= 1 - alphas[index]!;
    opacity[index] = 1 - clear;
  }
  return opacity;
}

/**
 * Hard-edged shadow copies, one every pixel (or further apart once the length passes 60px),
 * stepping out along the angle. With fade, the shadow gets more transparent toward the far end
 * in an even, linear ramp; on a box the copies overlap, so their alphas are compensated for that.
 */
export function longShadowSteps(s: Pick<LongShadowSettings, "angle" | "length" | "color" | "fade" | "target">): string {
  const length = Math.max(0, s.length);
  const steps = Math.min(LONG_SHADOW_MAX_STEPS, Math.max(1, Math.round(length)));
  const radians = (s.angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const ramp = longShadowRamp(steps, Math.min(1, Math.max(0, s.fade)));
  const alphas = s.target === "box" ? compensatedAlphas(ramp) : ramp;
  return alphas
    .map((alpha, index) => {
      const distance = (length * (index + 1)) / steps;
      return `${offset(dx * distance)} ${offset(dy * distance)} 0 ${hexToRgba(s.color, alpha)}`;
    })
    .join(", ");
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
