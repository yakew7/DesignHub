import { createId } from "@/lib/id";
import { defineEffect } from "@/lib/effects/define";
import { hexToRgba, px } from "@/lib/effects/css";
import type { ShadowLayer } from "@/types/effects";

export function shadowValue(layers: ShadowLayer[]): string {
  if (layers.length === 0) return "none";
  return layers
    .map((layer) => {
      const inset = layer.inset ? "inset " : "";
      return `${inset}${px(layer.x)} ${px(layer.y)} ${px(layer.blur)} ${px(layer.spread)} ${hexToRgba(layer.color, layer.opacity)}`;
    })
    .join(", ");
}

export function createLayer(patch: Partial<ShadowLayer> = {}): ShadowLayer {
  return {
    id: createId("shadow"),
    x: 0,
    y: 4,
    blur: 12,
    spread: 0,
    color: "#000000",
    opacity: 0.15,
    inset: false,
    ...patch,
  };
}

/**
 * "Smooth" shadows: several layers whose offset and blur grow on an ease-in curve
 * while opacity stays low - much closer to real light than one big shadow.
 */
export function smoothShadow(layers: number, distance: number, opacity: number, color = "#000000"): ShadowLayer[] {
  return Array.from({ length: layers }, (_, index) => {
    const t = (index + 1) / layers;
    const eased = t * t;
    return createLayer({
      y: Math.round(distance * eased * 10) / 10,
      blur: Math.round(distance * 2 * eased * 10) / 10,
      opacity: Math.round((opacity / layers) * 1.6 * 1000) / 1000,
      color,
    });
  });
}

export const shadowPresets: { id: string; label: string; layers: () => ShadowLayer[] }[] = [
  {
    id: "subtle",
    label: "Subtle",
    layers: () => [createLayer({ y: 1, blur: 3, opacity: 0.12 }), createLayer({ y: 1, blur: 2, opacity: 0.06 })],
  },
  { id: "smooth", label: "Smooth", layers: () => smoothShadow(6, 48, 0.35) },
  { id: "elevated", label: "Elevated", layers: () => [createLayer({ y: 24, blur: 48, spread: -12, opacity: 0.3 })] },
  { id: "sharp", label: "Sharp", layers: () => [createLayer({ x: 6, y: 6, blur: 0, opacity: 1 })] },
  { id: "inner", label: "Inner", layers: () => [createLayer({ y: 2, blur: 6, opacity: 0.25, inset: true })] },
  {
    id: "hairline",
    label: "Hairline",
    layers: () => [
      createLayer({ y: 0, blur: 0, spread: 1, opacity: 0.1 }),
      createLayer({ y: 1, blur: 2, opacity: 0.06 }),
    ],
  },
  {
    id: "card",
    label: "Soft card",
    layers: () => [
      createLayer({ y: 1, blur: 2, opacity: 0.06 }),
      createLayer({ y: 8, blur: 24, spread: -4, opacity: 0.12 }),
    ],
  },
  {
    id: "material",
    label: "Material",
    layers: () => [
      createLayer({ y: 2, blur: 4, spread: -1, opacity: 0.2 }),
      createLayer({ y: 4, blur: 5, opacity: 0.14 }),
      createLayer({ y: 1, blur: 10, opacity: 0.12 }),
    ],
  },
  { id: "floating", label: "Floating", layers: () => smoothShadow(8, 80, 0.3) },
  {
    id: "dramatic",
    label: "Dramatic",
    layers: () => [
      createLayer({ y: 40, blur: 80, spread: -20, opacity: 0.55 }),
      createLayer({ y: 8, blur: 16, opacity: 0.2 }),
    ],
  },
  { id: "brutal", label: "Brutal", layers: () => [createLayer({ x: 8, y: 8, blur: 0, opacity: 1 })] },
  {
    id: "long",
    label: "Long drop",
    layers: () => [createLayer({ x: 16, y: 24, blur: 32, spread: -8, opacity: 0.35 })],
  },
  {
    id: "glow",
    label: "Colored glow",
    layers: () => [
      createLayer({ y: 0, blur: 24, color: "#6366f1", opacity: 0.45 }),
      createLayer({ y: 12, blur: 40, spread: -8, color: "#6366f1", opacity: 0.35 }),
    ],
  },
  {
    id: "pressed",
    label: "Pressed",
    layers: () => [
      createLayer({ y: 2, blur: 4, opacity: 0.25, inset: true }),
      createLayer({ y: -1, blur: 0, color: "#ffffff", opacity: 0.08, inset: true }),
    ],
  },
  {
    id: "ring",
    label: "Focus ring",
    layers: () => [
      createLayer({ y: 0, blur: 0, spread: 2, color: "#ffffff", opacity: 1 }),
      createLayer({ y: 0, blur: 0, spread: 4, color: "#6366f1", opacity: 1 }),
    ],
  },
];

export const shadow = defineEffect({
  kind: "shadow",
  label: "Shadow",
  description: "Multi-layer box shadows with smooth presets.",
  generate(s) {
    return {
      needsFill: true,
      declarations: [
        { property: "border-radius", value: px(s.radius) },
        { property: "box-shadow", value: shadowValue(s.layers) },
      ],
    };
  },
});
