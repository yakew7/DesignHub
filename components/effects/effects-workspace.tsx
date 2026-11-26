"use client";

import { RotateCcw } from "lucide-react";
import { useMemo } from "react";

import { effectControls } from "@/components/effects/controls-map";
import { EffectOutput } from "@/components/effects/effect-output";
import { EffectPicker } from "@/components/effects/effect-picker";
import { EffectPreview } from "@/components/effects/effect-preview";
import { useI18n } from "@/components/layout/locale-provider";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useEffectContext } from "@/hooks/use-effect-context";
import { generateEffect } from "@/lib/effects/registry";
import { useEffectsStore } from "@/store/effects-store";

export function EffectsWorkspace() {
  const { t } = useI18n();
  const kind = useEffectsStore((state) => state.kind);
  const settings = useEffectsStore((state) => state.settings);
  const reset = useEffectsStore((state) => state.reset);
  const context = useEffectContext();
  const effect = useMemo(() => generateEffect(kind, settings[kind], context), [kind, settings, context]);
  const Controls = effectControls[kind];

  return (
    <StudioLayout
      id="effects"
      controls={
        <>
          <Panel collapsible id="effects-picker" title={t("effects.picker.label")}>
            <EffectPicker />
          </Panel>
          {Controls ? (
            <Panel
              title={t("studio.pane.controls")}
              actions={
                <Button variant="ghost" size="icon" aria-label={t("effects.reset")} onClick={() => reset(kind)}>
                  <RotateCcw />
                </Button>
              }
            >
              <Controls />
            </Panel>
          ) : null}
        </>
      }
      preview={<EffectPreview effect={effect} kind={kind} />}
      output={<EffectOutput kind={kind} effect={effect} />}
    />
  );
}
