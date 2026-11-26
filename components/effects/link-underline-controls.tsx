"use client";

import { Check, X } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { SliderField } from "@/components/ui/field";
import { LINK_UNDERLINE_MIN_CONTRAST, linkUnderlineContrast } from "@/lib/effects/link-underline";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function LinkUnderlineControls() {
  const { t } = useI18n();
  const s = useEffectSettings("link-underline");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("link-underline", patch);
  const ratio = linkUnderlineContrast(s);
  const pass = ratio >= LINK_UNDERLINE_MIN_CONTRAST;
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <ColorField label="Underline color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label="Thickness"
        value={s.thickness}
        min={1}
        max={8}
        step={1}
        onChange={(thickness) => set({ thickness })}
        format={pxFormat}
      />
      <SliderField
        label="Offset"
        value={s.offset}
        min={0}
        max={16}
        step={1}
        onChange={(offset) => set({ offset })}
        format={pxFormat}
      />
      <ColorField label="Page background" value={s.page} onChange={(page) => set({ page })} />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t("effects.linkUnderline.contrast")}</span>
          <Badge variant={pass ? "success" : "destructive"}>
            {pass ? <Check aria-hidden /> : <X aria-hidden />}
            {pass ? t("effects.badge.pass") : t("effects.badge.fail")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("effects.linkUnderline.summary", {
            ratio: (Math.floor(ratio * 100) / 100).toFixed(2),
            required: LINK_UNDERLINE_MIN_CONTRAST,
          })}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">{t("effects.linkUnderline.reducedMotion")}</p>
    </>
  );
}
