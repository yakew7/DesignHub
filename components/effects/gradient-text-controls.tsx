"use client";

import Link from "next/link";

import { ColorField, GradientColorsField, SwitchField } from "@/components/effects/fields";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffectContext } from "@/hooks/use-effect-context";
import { textGradient } from "@/lib/effects/gradient-text";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { GradientTextSource } from "@/types/effects";

const sources: { value: GradientTextSource; label: string }[] = [
  { value: "studio", label: "Color Studio" },
  { value: "custom", label: "Custom" },
];

export function GradientTextControls() {
  const s = useEffectSettings("gradient-text");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("gradient-text", patch);
  const gradient = textGradient(s, useEffectContext());

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Colors from</Label>
        <ToggleGroup
          type="single"
          value={s.source}
          onValueChange={(value) => value && set({ source: value as GradientTextSource })}
          aria-label="Gradient source"
          className="w-full"
        >
          {sources.map((source) => (
            <ToggleGroupItem key={source.value} value={source.value} className="flex-1">
              {source.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {s.source === "studio" ? (
        <div className="flex flex-col gap-1.5">
          <div aria-hidden="true" className="h-8 rounded-md border" style={{ backgroundImage: gradient.image }} />
          <Link
            href="/colors"
            className="self-end text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Edit in Color Studio
          </Link>
        </div>
      ) : (
        <>
          <GradientColorsField colors={s.colors} onChange={(colors) => set({ colors })} />
          <SliderField
            label="Angle"
            value={s.angle}
            min={0}
            max={360}
            onChange={(angle) => set({ angle })}
            format={(v) => `${v}°`}
          />
        </>
      )}
      <ColorField
        label={s.fallback ? "Fallback color" : "Fallback color (auto)"}
        value={s.fallback ?? gradient.first}
        onChange={(fallback) => set({ fallback })}
      />
      {s.fallback ? (
        <Button variant="ghost" size="sm" className="self-end" onClick={() => set({ fallback: null })}>
          Use the first gradient color
        </Button>
      ) : null}
      <SwitchField label="Animated shift" checked={s.animated} onChange={(animated) => set({ animated })} />
      {s.animated ? (
        <SliderField
          label="Speed"
          value={s.speed}
          min={2}
          max={20}
          step={0.5}
          onChange={(speed) => set({ speed })}
          format={(v) => `${v}s / sweep`}
        />
      ) : null}
    </>
  );
}
