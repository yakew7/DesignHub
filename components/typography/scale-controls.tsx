"use client";

import { RotateCcw } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scaleRatios } from "@/lib/typography/scale";
import { defaultScale, useTypographyStore } from "@/store/typography-store";

function RatioSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {scaleRatios.map((ratio) => (
            <SelectItem key={ratio.value} value={String(ratio.value)}>
              {ratio.value} · {ratio.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ScaleControls() {
  const { t } = useI18n();
  const scale = useTypographyStore((state) => state.scale);
  const updateScale = useTypographyStore((state) => state.updateScale);
  const px = (value: number) => `${value}px`;

  return (
    <Panel
      title={t("typography.scale.title")}
      description="Fluid between two viewports. Mobile values on the left, desktop on the right."
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("typography.scale.reset")}
          onClick={() => updateScale(defaultScale)}
        >
          <RotateCcw />
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Base · min"
          value={scale.minBase}
          min={12}
          max={24}
          onChange={(minBase) => updateScale({ minBase })}
          format={px}
        />
        <SliderField
          label="Base · max"
          value={scale.baseSize}
          min={12}
          max={28}
          onChange={(baseSize) => updateScale({ baseSize })}
          format={px}
        />
      </div>
      <RatioSelect
        label="Ratio · min viewport"
        value={scale.minRatio}
        onChange={(minRatio) => updateScale({ minRatio })}
      />
      <RatioSelect label="Ratio · max viewport" value={scale.ratio} onChange={(ratio) => updateScale({ ratio })} />
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Min viewport"
          value={scale.minViewport}
          min={320}
          max={768}
          step={8}
          onChange={(minViewport) => updateScale({ minViewport })}
          format={px}
        />
        <SliderField
          label="Max viewport"
          value={scale.maxViewport}
          min={960}
          max={1920}
          step={8}
          onChange={(maxViewport) => updateScale({ maxViewport })}
          format={px}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Steps up"
          value={scale.stepsUp}
          min={1}
          max={8}
          onChange={(stepsUp) => updateScale({ stepsUp })}
        />
        <SliderField
          label="Steps down"
          value={scale.stepsDown}
          min={0}
          max={3}
          onChange={(stepsDown) => updateScale({ stepsDown })}
        />
      </div>
    </Panel>
  );
}
