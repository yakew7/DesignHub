"use client";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function ScrollShadowControls() {
  const { t } = useI18n();
  const s = useEffectSettings("scroll-shadow");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("scroll-shadow", patch);

  return (
    <>
      <ColorField label="Shadow color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label="Strength"
        value={s.opacity}
        min={0.05}
        max={0.8}
        step={0.05}
        onChange={(opacity) => set({ opacity })}
        format={(value) => `${Math.round(value * 100)}%`}
      />
      <SliderField
        label="Shadow height"
        value={s.size}
        min={4}
        max={32}
        step={1}
        onChange={(size) => set({ size })}
        format={(value) => `${value}px`}
      />
      <ColorField label="Box background" value={s.surface} onChange={(surface) => set({ surface })} />
      <p className="text-xs text-muted-foreground">{t("effects.scrollShadow.note")}</p>
    </>
  );
}
