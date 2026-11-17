"use client";

import { ColorField, SwitchField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function GlowControls() {
  const { t } = useI18n();
  const s = useEffectSettings("glow");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("glow", patch);

  return (
    <>
      <ColorField label="Glow color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={4}
        max={120}
        onChange={(radius) => set({ radius })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label="Intensity"
        value={s.intensity}
        min={0.05}
        max={1}
        step={0.01}
        onChange={(intensity) => set({ intensity })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label="Corner radius"
        value={s.radiusCorner}
        min={0}
        max={48}
        onChange={(radiusCorner) => set({ radiusCorner })}
        format={(v) => `${v}px`}
      />
      <SwitchField label="Glowing text" checked={s.text} onChange={(text) => set({ text })} />
    </>
  );
}
