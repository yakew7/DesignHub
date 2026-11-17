"use client";

import "@/lib/i18n/areas/colors";

import { ChannelSlider } from "@/components/colors/channel-slider";
import { ColorInput } from "@/components/colors/color-input";
import { useI18n } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { inGamut, oklch, parseColor, toHex } from "@/lib/color/color";
import { hueName } from "@/lib/color/names";
import { useColorStore, useSelectedSwatch } from "@/store/color-store";
import type { ColorFormat, Oklch } from "@/types/color";

const formats: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"];
const HUE_STOPS = Array.from({ length: 13 }, (_, index) => index * 30);

export function OklchEditor() {
  const { t } = useI18n();
  const swatch = useSelectedSwatch();
  const updateColor = useColorStore((state) => state.updateColor);

  if (!swatch) return null;
  const color = swatch.color;
  const set = (patch: Partial<Oklch>) => {
    const next = { ...color, ...patch };
    updateColor(swatch.id, oklch(next.l, next.c, next.h, next.alpha));
  };

  const { l, c, h } = color;
  const srgb = inGamut(color, "srgb");
  const p3 = inGamut(color, "p3");

  return (
    <Panel
      title={t("colors.editor.title")}
      description={t("colors.editor.description")}
      actions={
        <label
          className="relative size-8 cursor-pointer overflow-hidden rounded-md border"
          title={t("colors.editor.pick")}
        >
          <span className="absolute inset-0" style={{ background: toHex(color) }} />
          <input
            type="color"
            aria-label={t("colors.editor.picker")}
            value={toHex({ ...color, alpha: 1 })}
            onChange={(event) => {
              const picked = parseColor(event.target.value);
              if (picked) updateColor(swatch.id, { ...picked, alpha: color.alpha });
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="size-10 rounded-md border" style={{ background: `oklch(${l} ${c} ${h} / ${color.alpha})` }} />
        <div className="flex flex-col">
          <span className="text-sm font-medium capitalize">{hueName(color)}</span>
          <span className="font-mono text-xs text-muted-foreground">{toHex(color)}</span>
        </div>
        <div className="ml-auto flex gap-1">
          <Badge variant={srgb ? "success" : "warning"}>
            {srgb ? t("colors.editor.inSrgb") : t("colors.editor.outSrgb")}
          </Badge>
          <Badge variant={p3 ? "success" : "destructive"}>
            {p3 ? t("colors.editor.inP3") : t("colors.editor.outP3")}
          </Badge>
        </div>
      </div>

      <ChannelSlider
        label={t("colors.editor.lightness")}
        value={l}
        min={0}
        max={1}
        step={0.001}
        display={`${(l * 100).toFixed(1)}%`}
        gradient={`linear-gradient(to right, oklch(0 ${c} ${h}), oklch(0.5 ${c} ${h}), oklch(1 ${c} ${h}))`}
        onChange={(value) => set({ l: value })}
      />
      <ChannelSlider
        label={t("colors.editor.chroma")}
        value={c}
        min={0}
        max={0.37}
        step={0.001}
        display={c.toFixed(3)}
        gradient={`linear-gradient(to right, oklch(${l} 0 ${h}), oklch(${l} 0.37 ${h}))`}
        onChange={(value) => set({ c: value })}
      />
      <ChannelSlider
        label={t("colors.editor.hue")}
        value={h}
        min={0}
        max={360}
        step={0.5}
        display={`${h.toFixed(1)}°`}
        gradient={`linear-gradient(to right, ${HUE_STOPS.map((stop) => `oklch(${l} ${Math.max(c, 0.08)} ${stop})`).join(", ")})`}
        onChange={(value) => set({ h: value })}
      />
      <ChannelSlider
        label={t("colors.editor.alpha")}
        value={color.alpha}
        min={0}
        max={1}
        step={0.01}
        display={`${Math.round(color.alpha * 100)}%`}
        gradient={`linear-gradient(to right, transparent, oklch(${l} ${c} ${h})), repeating-conic-gradient(var(--muted) 0 25%, transparent 0 50%) 0 0 / 8px 8px`}
        onChange={(value) => set({ alpha: value })}
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        {formats.map((format) => (
          <ColorInput key={format} format={format} color={color} onChange={(next) => updateColor(swatch.id, next)} />
        ))}
      </div>
    </Panel>
  );
}
