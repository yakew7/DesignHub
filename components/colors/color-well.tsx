"use client";

import "@/lib/i18n/areas/colors";

import { ColorInput } from "@/components/colors/color-input";
import { useI18n } from "@/components/layout/locale-provider";
import { Label } from "@/components/ui/label";
import { isSameColor, parseColor, toHex } from "@/lib/color/color";
import { cn } from "@/lib/utils";
import { useColorStore } from "@/store/color-store";
import type { Oklch } from "@/types/color";

type ColorWellProps = {
  id: string;
  label: string;
  color: Oklch;
  onChange: (color: Oklch) => void;
};

/** Pick a color from the palette, the system picker, or type any CSS color. */
export function ColorWell({ id, label, color, onChange }: ColorWellProps) {
  const { locale, t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border">
          <span className="absolute inset-0" style={{ background: toHex(color) }} />
          <input
            type="color"
            aria-label={t("colors.well.picker", { label })}
            value={toHex({ ...color, alpha: 1 })}
            onChange={(event) => {
              const picked = parseColor(event.target.value);
              if (picked) onChange(picked);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <div className="min-w-0 flex-1">
          <ColorInput format="hex" color={color} onChange={onChange} idPrefix={id} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={t("colors.well.palette", { label })}>
        {swatches.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            aria-label={t("colors.well.use", {
              color: toHex(swatch.color),
              label: label.toLocaleLowerCase(locale),
            })}
            aria-pressed={isSameColor(swatch.color, color)}
            onClick={() => onChange(swatch.color)}
            className={cn(
              "size-6 rounded-sm border ring-offset-1 ring-offset-card",
              isSameColor(swatch.color, color) && "ring-2 ring-foreground",
            )}
            style={{ background: toHex(swatch.color) }}
          />
        ))}
      </div>
    </div>
  );
}
