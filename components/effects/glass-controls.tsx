"use client";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function GlassControls() {
  const { t } = useI18n();
  const s = useEffectSettings("glass");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("glass", patch);

  return (
    <>
      <SliderField
        label="Blur"
        value={s.blur}
        min={0}
        max={40}
        onChange={(blur) => set({ blur })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label="Saturation"
        value={s.saturation}
        min={100}
        max={250}
        step={5}
        onChange={(saturation) => set({ saturation })}
        format={(v) => `${v}%`}
      />
      <ColorField label="Tint" value={s.tint} onChange={(tint) => set({ tint })} />
      <SliderField
        label="Opacity"
        value={s.opacity}
        min={0}
        max={0.8}
        step={0.01}
        onChange={(opacity) => set({ opacity })}
        format={percent}
      />
      <SliderField
        label={t("effects.kind.border.label")}
        value={s.borderOpacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(borderOpacity) => set({ borderOpacity })}
        format={percent}
      />
      <SliderField
        label={t("effects.kind.shadow.label")}
        value={s.shadowOpacity}
        min={0}
        max={0.8}
        step={0.01}
        onChange={(shadowOpacity) => set({ shadowOpacity })}
        format={percent}
      />
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={0}
        max={48}
        onChange={(radius) => set({ radius })}
        format={(v) => `${v}px`}
      />
    </>
  );
}
