"use client";

import { useEffect } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFontMeta } from "@/hooks/use-font-catalog";
import type { PlainMessageKey, Translate } from "@/lib/i18n/translate";
import { WEIGHT_NAMES, listFamilyWeights } from "@/lib/typography/compare";
import { useTypographyStore } from "@/store/typography-store";
import type { FontFamily } from "@/types/typography";

const weightKeys: Readonly<Record<number, PlainMessageKey>> = {
  100: "typography.weight.100",
  200: "typography.weight.200",
  300: "typography.weight.300",
  400: "typography.weight.400",
  500: "typography.weight.500",
  600: "typography.weight.600",
  700: "typography.weight.700",
  800: "typography.weight.800",
  900: "typography.weight.900",
};

/** The name of a CSS weight in the chosen language. A weight with no name returns `fallback`. */
export function weightName(t: Translate, weight: number, fallback = ""): string {
  const key = weightKeys[weight];
  return key ? t(key) : (WEIGHT_NAMES[weight] ?? fallback);
}

/** The static weights a family offers, once each and in ascending order. */
export function availableWeights(meta: FontFamily | undefined): number[] {
  return listFamilyWeights(meta);
}

export function WeightPicker() {
  const { t } = useI18n();
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
        <Label>{t("typography.weightpicker.label")}</Label>
        <ToggleGroup
          type="single"
          value={String(specimen.weight)}
          onValueChange={(value) => value && updateSpecimen({ weight: Number(value) })}
          className="grid w-full grid-cols-5 gap-0.5"
          aria-label={t("typography.weightpicker.group")}
        >
          {weights.map((weight) => (
            <ToggleGroupItem
              key={weight}
              value={String(weight)}
              aria-label={`${weightName(t, weight, String(weight))} (${weight})`}
              title={weightName(t, weight)}
              className="flex-1 font-mono tabular-nums"
            >
              {weight}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {meta?.italic ? (
        <div className="flex items-center justify-between">
          <Label htmlFor="specimen-italic">{t("typography.weightpicker.italic")}</Label>
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
