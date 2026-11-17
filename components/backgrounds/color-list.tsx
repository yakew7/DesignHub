"use client";

import { Palette, Plus, X } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toHex } from "@/lib/color/color";
import { MAX_BACKGROUND_COLORS, useBackgroundStore } from "@/store/background-store";
import { useColorStore } from "@/store/color-store";

function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border" title={value}>
      <span className="absolute inset-0" style={{ background: value }} />
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function ColorList() {
  const { t } = useI18n();
  const settings = useBackgroundStore((state) => state.settings);
  const update = useBackgroundStore((state) => state.update);
  const setColor = useBackgroundStore((state) => state.setColor);
  const addColor = useBackgroundStore((state) => state.addColor);
  const removeColor = useBackgroundStore((state) => state.removeColor);
  const swatches = useColorStore((state) => state.swatches);

  function applyPalette() {
    const palette = swatches.map((swatch) => toHex({ ...swatch.color, alpha: 1 }));
    const darkest = [...swatches].sort((a, b) => a.color.l - b.color.l)[0];
    update({
      colors: palette.slice(0, MAX_BACKGROUND_COLORS),
      background: darkest ? toHex({ ...darkest.color, alpha: 1 }) : settings.background,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>{t("brand.colors.label")}</Label>
        <Button variant="ghost" size="sm" className="h-7" onClick={applyPalette} title="Use your Color Studio palette">
          <Palette /> {t("colors.tab.palette")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Swatch
          label="Background color"
          value={settings.background}
          onChange={(background) => update({ background })}
        />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        {settings.colors.map((color, index) => (
          <div key={index} className="group relative">
            <Swatch label={`Color ${index + 1}`} value={color} onChange={(value) => setColor(index, value)} />
            {settings.colors.length > 1 ? (
              <button
                type="button"
                onClick={() => removeColor(index)}
                aria-label={`Remove color ${index + 1}`}
                className="absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full border bg-popover text-muted-foreground group-hover:flex group-focus-within:flex hover:text-foreground"
              >
                <X className="size-2.5" />
              </button>
            ) : null}
          </div>
        ))}
        {settings.colors.length < MAX_BACKGROUND_COLORS ? (
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Add color"
            onClick={() => addColor(settings.colors[settings.colors.length - 1] ?? "#6366f1")}
          >
            <Plus />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
