"use client";

import Link from "next/link";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffectContext } from "@/hooks/use-effect-context";
import { skeletonColors } from "@/lib/effects/skeleton";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { SkeletonSource, SkeletonTone } from "@/types/effects";

const sources: { value: SkeletonSource; label: string }[] = [
  { value: "brand", label: "Brand" },
  { value: "custom", label: "Custom" },
];

const tones: { value: SkeletonTone; label: string }[] = [
  { value: "light", label: "Light page" },
  { value: "dark", label: "Dark page" },
];

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as T)}
        aria-label={label}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="flex-1">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export function SkeletonControls() {
  const { t } = useI18n();
  const s = useEffectSettings("skeleton");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("skeleton", patch);
  const colors = skeletonColors(s, useEffectContext());

  return (
    <>
      <Choice label="Colors from" value={s.source} options={sources} onChange={(source) => set({ source })} />
      {s.source === "brand" ? (
        <>
          <Choice label="Sits on" value={s.tone} options={tones} onChange={(tone) => set({ tone })} />
          <div className="flex flex-col gap-1.5">
            <div aria-hidden="true" className="flex h-8 overflow-hidden rounded-md border">
              <span className="flex-1" style={{ background: colors.base }} />
              <span className="flex-1" style={{ background: colors.highlight }} />
            </div>
            <Link
              href="/colors"
              className="self-end text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("effects.skeleton.editNeutrals")}
            </Link>
          </div>
        </>
      ) : (
        <>
          <ColorField label="Block" value={s.base} onChange={(base) => set({ base })} />
          <ColorField label="Highlight" value={s.highlight} onChange={(highlight) => set({ highlight })} />
        </>
      )}
      <SliderField
        label="Speed"
        value={s.speed}
        min={0.6}
        max={4}
        step={0.1}
        onChange={(speed) => set({ speed })}
        format={(value) => `${value.toFixed(1)}s / sweep`}
      />
      <SliderField
        label="Angle"
        value={s.angle}
        min={0}
        max={180}
        onChange={(angle) => set({ angle })}
        format={(value) => `${value}°`}
      />
      <SliderField
        label={t("effects.field.radius")}
        value={s.radius}
        min={0}
        max={48}
        onChange={(radius) => set({ radius })}
        format={(value) => `${value}px`}
      />
    </>
  );
}
