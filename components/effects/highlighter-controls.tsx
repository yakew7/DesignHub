"use client";

import { Check, X } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { SliderField } from "@/components/ui/field";
import { contrastRatio, parseColor } from "@/lib/color/color";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function HighlighterControls() {
  const { t } = useI18n();
  const s = useEffectSettings("highlighter");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("highlighter", patch);
  const text = parseColor(s.textColor);
  const highlight = parseColor(s.color);
  const ratio = text && highlight ? contrastRatio(text, highlight) : 0;
  const pass = ratio >= 4.5;
  const ratioLabel = (Math.floor(ratio * 100) / 100).toFixed(2);
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <ColorField label="Highlight color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label="Thickness"
        value={s.thickness}
        min={15}
        max={90}
        step={1}
        onChange={(thickness) => set({ thickness })}
        format={(value) => `${value}%`}
      />
      <SliderField
        label="Vertical offset"
        value={s.offset}
        min={-8}
        max={8}
        step={1}
        onChange={(offset) => set({ offset })}
        format={pxFormat}
      />
      <ColorField label="Text color" value={s.textColor} onChange={(textColor) => set({ textColor })} />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t("effects.contrast.text")}</span>
          <Badge variant={pass ? "success" : "destructive"}>
            {pass ? <Check aria-hidden /> : <X aria-hidden />}
            {pass ? t("effects.badge.pass") : t("effects.badge.fail")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("effects.highlighter.summary", { ratio: ratioLabel, required: 4.5 })}
        </p>
      </div>
    </>
  );
}
