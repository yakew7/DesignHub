"use client";

import { useEffect } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { useTypographyStore } from "@/store/typography-store";
import type { FontFamily } from "@/types/typography";

export const weightNames: Record<number, string> = {
  100: "Thin",
  200: "Extra light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extra bold",
  900: "Black",
};

/** The static weights a family offers, once each and in ascending order. */
export function availableWeights(meta: FontFamily | undefined): number[] {
  return meta?.weights.length ? [...new Set(meta.weights)].sort((a, b) => a - b) : [400];
}

export function WeightPicker() {
  const activeFont = useTypographyStore((state) => state.activeFont);
  const specimen = useTypographyStore((state) => state.specimen);
  const updateSpecimen = useTypographyStore((state) => state.updateSpecimen);
  const meta = useFontMeta(activeFont);
  const weights = availableWeights(meta);

  useEffect(() => {
    if (!meta || meta.axes?.some((axis) => axis.tag === "wght") || meta.weights.includes(specimen.weight)) return;
    const nearest = meta.weights.reduce((best, weight) =>
      Math.abs(weight - specimen.weight) < Math.abs(best - specimen.weight) ? weight : best,
    );
    updateSpecimen({ weight: nearest });
  }, [meta, specimen.weight, updateSpecimen]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label>Weight</Label>
        <ToggleGroup
          type="single"
          value={String(specimen.weight)}
          onValueChange={(value) => value && updateSpecimen({ weight: Number(value) })}
          className="grid w-full grid-cols-5 gap-0.5"
          aria-label="Font weight"
        >
          {weights.map((weight) => (
            <ToggleGroupItem
              key={weight}
              value={String(weight)}
              aria-label={`${weightNames[weight] ?? weight} (${weight})`}
              title={weightNames[weight]}
              className="flex-1 font-mono tabular-nums"
            >
              {weight}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {meta?.italic ? (
        <div className="flex items-center justify-between">
          <Label htmlFor="specimen-italic">Italic</Label>
          <Switch
            id="specimen-italic"
            checked={specimen.italic}
            onCheckedChange={(italic) => updateSpecimen({ italic })}
          />
        </div>
      ) : null}
    </div>
  );
}
