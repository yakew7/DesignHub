"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { CheckList } from "@/components/accessibility/check-list";
import { SwitchField } from "@/components/effects/fields";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useReadability } from "@/hooks/use-readability";
import { useA11yStore } from "@/store/a11y-store";

export function ReadabilityPanel() {
  const { t } = useI18n();
  const typography = useA11yStore((state) => state.typography);
  const setTypography = useA11yStore((state) => state.setTypography);
  const simulation = useA11yStore((state) => state.dyslexiaSimulation);
  const setSimulation = useA11yStore((state) => state.setDyslexiaSimulation);
  const { checks } = useReadability();
  const em = (value: number) => `${value.toFixed(2)}em`;

  return (
    <>
      <Panel title={t("home.hl.readability")}>
        <SliderField
          label="Font size"
          value={typography.size}
          min={10}
          max={24}
          onChange={(size) => setTypography({ size })}
          format={(v) => `${v}px`}
        />
        <SliderField
          label="Line height"
          value={typography.lineHeight}
          min={1}
          max={2.2}
          step={0.05}
          onChange={(lineHeight) => setTypography({ lineHeight })}
          format={(v) => v.toFixed(2)}
        />
        <SliderField
          label="Text column"
          value={typography.measure}
          min={240}
          max={1000}
          step={10}
          onChange={(measure) => setTypography({ measure })}
          format={(v) => `${v}px`}
        />
        <CheckList items={checks} label={t("a11y.readability.checks")} />
      </Panel>
      <Panel
        title="Dyslexia preview"
        description="Spacing helps many readers; the simulation hints at what reading can feel like."
      >
        <SliderField
          label="Letter spacing"
          value={typography.letterSpacing}
          min={0}
          max={0.2}
          step={0.01}
          onChange={(letterSpacing) => setTypography({ letterSpacing })}
          format={em}
        />
        <SliderField
          label="Word spacing"
          value={typography.wordSpacing}
          min={0}
          max={0.5}
          step={0.02}
          onChange={(wordSpacing) => setTypography({ wordSpacing })}
          format={em}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setTypography({
              family: "Atkinson Hyperlegible Next",
              letterSpacing: 0.05,
              wordSpacing: 0.16,
              lineHeight: 1.8,
              size: Math.max(typography.size, 18),
            })
          }
        >
          Apply dyslexia-friendly preset
        </Button>
        <SwitchField label="Reading simulation (scrambled letters)" checked={simulation} onChange={setSimulation} />
      </Panel>
    </>
  );
}
