import { parseColor } from "@/lib/color/color";
import { px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import { tone } from "@/lib/effects/neumorphism";
import { shadowValue } from "@/lib/effects/shadow";
import type { InsetSettings } from "@/types/effects";

type InsetShadow = Pick<InsetSettings, "x" | "y" | "blur" | "spread" | "color" | "opacity">;

export const insetPresets: { id: string; label: string; shadow: InsetShadow }[] = [
  { id: "input", label: "Input", shadow: { x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 0.14 } },
  { id: "pressed", label: "Pressed", shadow: { x: 0, y: 3, blur: 8, spread: 0, color: "#000000", opacity: 0.3 } },
  { id: "well", label: "Deep well", shadow: { x: 0, y: 6, blur: 18, spread: -2, color: "#000000", opacity: 0.45 } },
];

/** An inset box shadow on a solid fill, so it reads as a recessed input or a pressed button. */
export const inset = defineEffect({
  kind: "inset",
  label: "Inner shadow",
  description: "Inset shadows for inputs, wells and pressed states.",
  generate(s) {
    // Preview on a page a touch lighter (or, for near-white fills, darker) than the element.
    const lightness = parseColor(s.fill)?.l ?? 0.9;
    return {
      surface: tone(s.fill, lightness > 0.9 ? -0.04 : 0.05),
      declarations: [
        { property: "background-color", value: s.fill },
        { property: "border-radius", value: px(s.radius) },
        { property: "box-shadow", value: shadowValue([{ ...s, id: "inset", inset: true }]) },
      ],
    };
  },
});
