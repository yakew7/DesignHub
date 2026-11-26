"use client";

import { RotateCcw } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { defaultRhythm, useTypographyStore } from "@/store/typography-store";

export function RhythmControls() {
  const { t } = useI18n();
  const rhythm = useTypographyStore((state) => state.rhythm);
  const updateRhythm = useTypographyStore((state) => state.updateRhythm);
  const em = (value: number) => `${value.toFixed(3)}em`;

  return (
    <Panel
      collapsible
      id="typography-rhythm"
      title={t("typography.rhythm.title")}
      description="Line height, letter spacing and weight for headings and body."
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("typography.rhythm.reset")}
          onClick={() => updateRhythm(defaultRhythm)}
        >
          <RotateCcw />
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="Heading weight"
          value={rhythm.headingWeight}
          min={100}
          max={900}
          step={100}
          onChange={(headingWeight) => updateRhythm({ headingWeight })}
        />
        <SliderField
          label="Body weight"
          value={rhythm.bodyWeight}
          min={100}
          max={900}
          step={100}
          onChange={(bodyWeight) => updateRhythm({ bodyWeight })}
        />
        <SliderField
          label="Heading leading"
          value={rhythm.headingLineHeight}
          min={0.8}
          max={1.6}
          step={0.01}
          onChange={(headingLineHeight) => updateRhythm({ headingLineHeight })}
          format={(v) => v.toFixed(2)}
        />
        <SliderField
          label="Body leading"
          value={rhythm.bodyLineHeight}
          min={1.1}
          max={2.2}
          step={0.01}
          onChange={(bodyLineHeight) => updateRhythm({ bodyLineHeight })}
          format={(v) => v.toFixed(2)}
        />
        <SliderField
          label="Heading tracking"
          value={rhythm.headingTracking}
          min={-0.08}
          max={0.1}
          step={0.005}
          onChange={(headingTracking) => updateRhythm({ headingTracking })}
          format={em}
        />
        <SliderField
          label="Body tracking"
          value={rhythm.bodyTracking}
          min={-0.05}
          max={0.1}
          step={0.005}
          onChange={(bodyTracking) => updateRhythm({ bodyTracking })}
          format={em}
        />
      </div>
    </Panel>
  );
}
