"use client";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { ButtonPressEasing } from "@/types/effects";

const easings: { value: ButtonPressEasing; label: string }[] = [
  { value: "ease-out", label: "Ease out" },
  { value: "ease-in-out", label: "Ease in out" },
  { value: "spring", label: "Spring" },
  { value: "linear", label: "Linear" },
];

export function ButtonPressControls() {
  const { t } = useI18n();
  const s = useEffectSettings("button-press");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("button-press", patch);
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <ColorField label="Button color" value={s.fill} onChange={(fill) => set({ fill })} />
      <SliderField
        label="Lift on hover"
        value={s.lift}
        min={0}
        max={12}
        step={0.5}
        onChange={(lift) => set({ lift })}
        format={pxFormat}
      />
      <SliderField
        label="Press depth"
        value={s.press}
        min={0}
        max={8}
        step={0.5}
        onChange={(press) => set({ press })}
        format={pxFormat}
      />
      <SliderField
        label="Duration"
        value={s.duration}
        min={50}
        max={600}
        step={10}
        onChange={(duration) => set({ duration })}
        format={(value) => `${value}ms`}
      />
      <div className="flex flex-col gap-2">
        <Label>Easing</Label>
        <ToggleGroup
          type="single"
          value={s.easing}
          onValueChange={(value) => value && set({ easing: value as ButtonPressEasing })}
          aria-label="Easing"
          className="w-full flex-wrap"
        >
          {easings.map((easing) => (
            <ToggleGroupItem key={easing.value} value={easing.value} className="flex-1">
              {easing.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={0}
        max={32}
        onChange={(radius) => set({ radius })}
        format={pxFormat}
      />
      <p className="text-xs text-muted-foreground">
        With reduced motion turned on, the button keeps its shadow change but doesn&apos;t move.
      </p>
    </>
  );
}
