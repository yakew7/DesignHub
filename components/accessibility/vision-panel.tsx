"use client";

import { useMemo } from "react";

import { SwitchField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { Panel } from "@/components/ui/panel";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { visionModes, visionSection } from "@/lib/a11y/vision";
import { cn } from "@/lib/utils";
import { useA11yStore } from "@/store/a11y-store";

export function VisionPanel({
  compare,
  onCompareChange,
}: {
  compare: boolean;
  onCompareChange: (value: boolean) => void;
}) {
  const { t } = useI18n();
  const radiosRef = useRovingRadio<HTMLDivElement>();
  const vision = useA11yStore((state) => state.vision);
  const setVision = useA11yStore((state) => state.setVision);
  const colors = useA11yStore((state) => state.colors);
  const results = useMemo(() => visionSection(colors), [colors]);

  return (
    <>
      <Panel title={t("home.hl.colorVision")} description="Simulated with the Machado 2009 model.">
        <div ref={radiosRef} role="radiogroup" aria-label={t("a11y.vision.simulation")} className="flex flex-col gap-1">
          {visionModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={vision === mode.value}
              onClick={() => setVision(mode.value)}
              className={cn(
                "flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors duration-150 hover:border-border-strong",
                vision === mode.value && "border-brand/60 bg-surface-raised",
              )}
            >
              <span className="text-sm font-medium">{mode.label}</span>
              <span className="text-xs text-muted-foreground">{mode.description}</span>
            </button>
          ))}
        </div>
        <SwitchField label="Compare all side by side" checked={compare} onChange={onCompareChange} />
      </Panel>
      <Panel
        title={t("a11y.vision.perceived")}
        description="Contrast after simulation. A pair that only differs in hue collapses here."
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-subtle-foreground">
              <th className="pb-1 font-medium">{t("a11y.vision.mode")}</th>
              {results[0]?.pairs.map((pair) => (
                <th key={pair.check} className="pr-2 pb-1 font-medium">
                  {pair.check}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.mode} className="border-t">
                <th scope="row" className="py-1.5 text-left font-medium capitalize">
                  {row.mode}
                </th>
                {row.pairs.map((pair) => (
                  <td
                    key={pair.check}
                    className={cn(
                      "py-1.5 pr-2 font-mono tabular-nums",
                      pair.passAA ? "text-success" : "text-destructive",
                    )}
                  >
                    {pair.ratio.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
