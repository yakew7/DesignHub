"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EffectBackdrop } from "@/components/effects/effect-backdrop";
import { parseColor } from "@/lib/color/color";
import { effectStylesheet } from "@/lib/effects/css";
import { useEffectsStore } from "@/store/effects-store";
import type { EffectBackdrop as Backdrop, EffectCss } from "@/types/effects";

function isDark(hex: string): boolean {
  const color = parseColor(hex);
  return color ? color.l < 0.6 : true;
}

export const PREVIEW_SELECTOR = ".dh-effect-preview";

const PLAIN = new Set<Backdrop>(["light", "dark"]);

const backdrops: { value: Backdrop; label: string }[] = [
  { value: "gradient", label: "Gradient" },
  { value: "photo", label: "Photo" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function EffectPreview({ effect }: { effect: EffectCss | null }) {
  const chosen = useEffectsStore((state) => state.backdrop);
  const setBackdrop = useEffectsStore((state) => state.setBackdrop);
  const surface = effect?.surface;
  const plain = Boolean(effect?.plainBackdrop);
  // A gradient fill disappears into a busy backdrop, so those effects fall back to the dark one.
  const backdrop = plain && !PLAIN.has(chosen) ? "dark" : chosen;
  const dark = surface ? isDark(surface) : backdrop !== "light";

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Preview</h2>
        <ToggleGroup
          type="single"
          value={backdrop}
          onValueChange={(value) => value && setBackdrop(value as Backdrop)}
          aria-label="Preview backdrop"
          disabled={Boolean(surface)}
        >
          {backdrops.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} disabled={plain && !PLAIN.has(item.value)}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {/* The stylesheet is generated from numeric controls and color pickers, never from free text. */}
      {effect ? <style>{effectStylesheet(effect, PREVIEW_SELECTOR)}</style> : null}
      <EffectBackdrop backdrop={backdrop} surface={surface}>
        <article
          style={effect?.needsFill ? { backgroundColor: dark ? "#18181b" : "#ffffff" } : undefined}
          className={`dh-effect-preview flex w-full max-w-sm flex-col gap-3 p-8 ${dark ? "text-white" : "text-slate-800"}`}
        >
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">Effects Lab</p>
          <h3 className="font-display text-2xl font-semibold">Depth without the fuss.</h3>
          <p className="text-sm opacity-80">Tweak the controls; copy production-ready CSS or Tailwind utilities.</p>
        </article>
      </EffectBackdrop>
    </>
  );
}
