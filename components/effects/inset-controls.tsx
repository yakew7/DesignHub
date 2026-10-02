"use client";

import { ColorField } from "@/components/effects/fields";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { insetPresets } from "@/lib/effects/inset";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function InsetControls() {
  const s = useEffectSettings("inset");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("inset", patch);
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Presets</Label>
        <div className="flex flex-wrap gap-1.5">
          {insetPresets.map((preset) => (
            <Button key={preset.id} variant="outline" size="sm" onClick={() => set(preset.shadow)}>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SliderField label="X" value={s.x} min={-40} max={40} onChange={(x) => set({ x })} format={pxFormat} />
        <SliderField label="Y" value={s.y} min={-40} max={40} onChange={(y) => set({ y })} format={pxFormat} />
        <SliderField
          label="Blur"
          value={s.blur}
          min={0}
          max={60}
          onChange={(blur) => set({ blur })}
          format={pxFormat}
        />
        <SliderField
          label="Spread"
          value={s.spread}
          min={-20}
          max={20}
          onChange={(spread) => set({ spread })}
          format={pxFormat}
        />
      </div>
      <ColorField label="Shadow color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label="Opacity"
        value={s.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(opacity) => set({ opacity })}
        format={(value) => `${Math.round(value * 100)}%`}
      />
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
  );
}
