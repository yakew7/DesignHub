"use client";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function CardTiltControls() {
  const { t } = useI18n();
  const s = useEffectSettings("card-tilt");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("card-tilt", patch);

  return (
    <>
      <SliderField
        label="Tilt"
        value={s.maxTilt}
        min={2}
        max={25}
        step={1}
        onChange={(maxTilt) => set({ maxTilt })}
        format={(v) => `${v}°`}
      />
      <SliderField
        label="Perspective"
        value={s.perspective}
        min={300}
        max={1600}
        step={50}
        onChange={(perspective) => set({ perspective })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label="Glare"
        value={s.glare}
        min={0}
        max={0.8}
        step={0.01}
        onChange={(glare) => set({ glare })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label="Duration"
        value={s.duration}
        min={100}
        max={600}
        step={25}
        onChange={(duration) => set({ duration })}
        format={(v) => `${v}ms`}
      />
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={0}
        max={32}
        step={1}
        onChange={(radius) => set({ radius })}
        format={(v) => `${v}px`}
      />
      <ColorField label="Card color" value={s.fill} onChange={(fill) => set({ fill })} />
      <p className="text-xs text-muted-foreground">{t("effects.cardTilt.note")}</p>
    </>
  );
}
