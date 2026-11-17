"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ShadowLayerEditor } from "@/components/effects/shadow-layer-editor";
import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { createLayer, shadowPresets } from "@/lib/effects/shadow";
import { cn } from "@/lib/utils";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { ShadowLayer } from "@/types/effects";

const MAX_LAYERS = 8;

export function ShadowControls() {
  const { t } = useI18n();
  const s = useEffectSettings("shadow");
  const update = useEffectsStore((state) => state.update);
  const [selected, setSelected] = useState(0);
  const active = s.layers[Math.min(selected, s.layers.length - 1)];

  const setLayers = (layers: ShadowLayer[]) => update("shadow", { layers });
  const patchLayer = (id: string, patch: Partial<ShadowLayer>) =>
    setLayers(s.layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Presets</Label>
        <div className="flex flex-wrap gap-1.5">
          {shadowPresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => {
                setLayers(preset.layers());
                setSelected(0);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Layers</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            disabled={s.layers.length >= MAX_LAYERS}
            onClick={() => {
              setLayers([...s.layers, createLayer()]);
              setSelected(s.layers.length);
            }}
          >
            <Plus /> Add layer
          </Button>
        </div>
        <ol className="flex flex-col gap-1" aria-label="Shadow layers">
          {s.layers.map((layer, index) => (
            <li key={layer.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={active?.id === layer.id}
                className={cn(
                  "flex h-8 flex-1 items-center gap-2 rounded-md border px-2 font-mono text-[11px] text-muted-foreground hover:border-border-strong",
                  active?.id === layer.id && "border-brand/60 text-foreground",
                )}
              >
                <span
                  className="size-3 rounded-sm border"
                  style={{ background: layer.color, opacity: Math.max(0.2, layer.opacity) }}
                />
                {layer.inset ? "inset " : ""}
                {layer.x} {layer.y} {layer.blur} {layer.spread}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Remove layer ${index + 1}`}
                disabled={s.layers.length <= 1}
                onClick={() => setLayers(s.layers.filter((item) => item.id !== layer.id))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ol>
      </div>
      {active ? <ShadowLayerEditor layer={active} onChange={(patch) => patchLayer(active.id, patch)} /> : null}
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={0}
        max={48}
        onChange={(radius) => update("shadow", { radius })}
        format={(v) => `${v}px`}
      />
    </>
  );
}
