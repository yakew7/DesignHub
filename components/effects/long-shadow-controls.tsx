"use client";

import { ColorField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { LongShadowTarget } from "@/types/effects";

const targets: { value: LongShadowTarget; label: string }[] = [
  { value: "box", label: "Box" },
  { value: "text", label: "Text" },
];

export function LongShadowControls() {
  const s = useEffectSettings("long-shadow");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("long-shadow", patch);
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Target</Label>
        <ToggleGroup
          type="single"
          value={s.target}
          onValueChange={(value) => value && set({ target: value as LongShadowTarget })}
          aria-label="Target"
          className="w-full"
        >
          {targets.map((target) => (
            <ToggleGroupItem key={target.value} value={target.value} className="flex-1">
              {target.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <SliderField
        label="Angle"
        value={s.angle}
        min={0}
        max={359}
        onChange={(angle) => set({ angle })}
        format={(value) => `${value}°`}
      />
      <SliderField
        label="Length"
        value={s.length}
        min={4}
        max={120}
        onChange={(length) => set({ length })}
        format={pxFormat}
      />
      <ColorField label="Shadow color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label="Fade"
        value={s.fade}
        min={0}
        max={1}
        step={0.01}
        onChange={(fade) => set({ fade })}
        format={(value) => `${Math.round(value * 100)}%`}
      />
      {s.target === "box" ? (
        <>
          <ColorField label="Fill" value={s.fill} onChange={(fill) => set({ fill })} />
          <SliderField
            label="Corner radius"
            value={s.radius}
            min={0}
            max={48}
            onChange={(radius) => set({ radius })}
            format={pxFormat}
          />
        </>
      ) : null}
    </>
  );
}
