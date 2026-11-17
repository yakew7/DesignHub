"use client";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { NeumorphismShape } from "@/types/effects";

const shapes: NeumorphismShape[] = ["flat", "concave", "convex", "pressed"];

export function NeumorphismControls() {
  const { t } = useI18n();
  const s = useEffectSettings("neumorphism");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("neumorphism", patch);

  return (
    <>
      <ColorField label="Surface" value={s.color} onChange={(color) => set({ color })} />
      <div className="flex flex-col gap-2">
        <Label>Shape</Label>
        <ToggleGroup
          type="single"
          value={s.shape}
          onValueChange={(value) => value && set({ shape: value as NeumorphismShape })}
          aria-label="Shape"
          className="w-full"
        >
          {shapes.map((shape) => (
            <ToggleGroupItem key={shape} value={shape} className="flex-1 capitalize">
              {shape}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <SliderField
        label="Depth"
        value={s.depth}
        min={1}
        max={40}
        onChange={(depth) => set({ depth })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label="Softness"
        value={s.blur}
        min={0}
        max={80}
        onChange={(blur) => set({ blur })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label="Intensity"
        value={s.intensity}
        min={0.02}
        max={0.4}
        step={0.01}
        onChange={(intensity) => set({ intensity })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label="Light direction"
        value={s.lightAngle}
        min={0}
        max={359}
        onChange={(lightAngle) => set({ lightAngle })}
        format={(v) => `${v}°`}
      />
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={0}
        max={64}
        onChange={(radius) => set({ radius })}
        format={(v) => `${v}px`}
      />
    </>
  );
}
