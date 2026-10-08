"use client";

import { ColorField, GradientColorsField, SwitchField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function BorderControls() {
  const s = useEffectSettings("border");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("border", patch);

  return (
    <>
      <GradientColorsField colors={s.colors} onChange={(colors) => set({ colors })} />
      <ColorField label="Fill" value={s.fill} onChange={(fill) => set({ fill })} />
      <SliderField
        label="Thickness"
        value={s.thickness}
        min={1}
        max={12}
        onChange={(thickness) => set({ thickness })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label="Radius"
        value={s.radius}
        min={0}
        max={48}
        onChange={(radius) => set({ radius })}
        format={(v) => `${v}px`}
      />
      {s.animated ? null : (
        <SliderField
          label="Angle"
          value={s.angle}
          min={0}
          max={360}
          onChange={(angle) => set({ angle })}
          format={(v) => `${v}°`}
        />
      )}
      <SwitchField label="Animated" checked={s.animated} onChange={(animated) => set({ animated })} />
      {s.animated ? (
        <SliderField
          label="Speed"
          value={s.speed}
          min={1}
          max={12}
          step={0.5}
          onChange={(speed) => set({ speed })}
          format={(v) => `${v}s / turn`}
        />
      ) : null}
    </>
  );
}
