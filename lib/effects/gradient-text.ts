import { toHex } from "@/lib/color/color";
import { gradientCss, gradientCssFallback, sortedStops } from "@/lib/color/gradient";
import { defaultEffectContext, defineEffect } from "@/lib/effects/define";
import type { Gradient } from "@/types/color";
import type { EffectContext, GradientTextSettings } from "@/types/effects";

const DEFAULT_COLORS = ["#6366f1", "#f472b6"];

export type TextGradient = {
  /** sRGB hex gradient every browser with gradients can paint. */
  image: string;
  /** The same gradient with its OKLCH or OKLab interpolation, for browsers that support it. */
  modern?: { image: string; space: string };
  /** First color, the default solid fallback. */
  first: string;
};

function studioGradient(gradient: Gradient): TextGradient {
  const first = sortedStops(gradient)[0];
  return {
    image: gradientCssFallback(gradient),
    modern:
      gradient.interpolation === "srgb" ? undefined : { image: gradientCss(gradient), space: gradient.interpolation },
    first: first ? toHex(first.color) : DEFAULT_COLORS[0]!,
  };
}

function customGradient(s: GradientTextSettings): TextGradient {
  const stops = s.colors.length >= 2 ? s.colors : DEFAULT_COLORS;
  return { image: `linear-gradient(${s.angle}deg, ${stops.join(", ")})`, first: stops[0]! };
}

/** The gradient the text is filled with: the Color Studio gradient, or the effect's own stops. */
export function textGradient(s: GradientTextSettings, context: EffectContext): TextGradient {
  return s.source === "studio" ? studioGradient(context.gradient) : customGradient(s);
}

/**
 * Text filled with a gradient: the gradient is the element's background, clipped to the glyphs, and
 * the text fill is made transparent so it shows through. `color` stays a solid fallback, so the text
 * is readable (and selectable, as it is still real text) wherever clipping to text isn't supported:
 * only engines that clip backgrounds to text honor -webkit-text-fill-color.
 */
export const gradientText = defineEffect({
  kind: "gradient-text",
  label: "Gradient text",
  description: "Text filled with your Color Studio gradient, optionally shifting.",
  generate(s, context = defaultEffectContext) {
    const gradient = textGradient(s, context);
    const declarations = [
      { property: "color", value: s.fallback ?? gradient.first },
      { property: "background-image", value: gradient.image },
      ...(s.animated
        ? [
            { property: "background-size", value: "200% 100%" },
            { property: "animation", value: `gradient-text-shift ${s.speed}s ease-in-out infinite alternate` },
          ]
        : []),
      { property: "-webkit-background-clip", value: "text" },
      { property: "background-clip", value: "text" },
      { property: "-webkit-text-fill-color", value: "transparent" },
    ];

    return {
      declarations,
      plainBackdrop: true,
      tailwindNote: s.animated
        ? "The shift also needs the @keyframes rule from the CSS tab in your stylesheet."
        : undefined,
      global: s.animated
        ? `@keyframes gradient-text-shift {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 100% 50%;
  }
}`
        : undefined,
      extra: (selector) =>
        [
          gradient.modern
            ? `@supports (background-image: linear-gradient(in ${gradient.modern.space}, red, blue)) {
  ${selector} {
    background-image: ${gradient.modern.image};
  }
}`
            : "",
          // High contrast themes force the text color, so draw the glyphs in it instead of the gradient.
          `@media (forced-colors: active) {
  ${selector} {
    -webkit-text-fill-color: currentColor;
    background: none;
  }
}`,
          s.animated
            ? `@media (prefers-reduced-motion: reduce) {
  ${selector} {
    animation: none;
  }
}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
    };
  },
});
