"use client";

import "@/lib/i18n/areas/colors";

import { useI18n } from "@/components/layout/locale-provider";
import { useCopy } from "@/hooks/use-copy";
import { contrastRatio, formatColor, oklch, readableTextColor, toHex } from "@/lib/color/color";
import { cn } from "@/lib/utils";
import { useColorStore } from "@/store/color-store";
import type { Shade } from "@/types/color";

const white = oklch(1, 0, 0);

type ShadeRampProps = {
  name: string;
  shades: Shade[];
  size?: "lg" | "sm";
  anchorStep?: number;
};

export function ShadeRamp({ name, shades, size = "lg", anchorStep }: ShadeRampProps) {
  const { t } = useI18n();
  const format = useColorStore((state) => state.format);
  const { copy } = useCopy();

  return (
    <ol
      data-user-colors=""
      aria-label={t("colors.shades.ramp", { name })}
      className={cn("grid grid-cols-11 overflow-hidden rounded-lg border", size === "lg" ? "min-h-40" : "h-12")}
    >
      {shades.map((shade) => {
        const value = formatColor(shade.color, format);
        const text = toHex(readableTextColor(shade.color));
        const passesOnWhite = contrastRatio(shade.color, white) >= 4.5;
        // The token name ("blue-500") is generated output, so it stays as it is.
        const token = `${name}-${shade.step}`;
        return (
          <li key={shade.step} className="flex">
            <button
              type="button"
              onClick={() => copy(value, t("colors.shades.copied", { token, value }))}
              aria-label={`${t("colors.shades.copy", { token, value })}${size === "lg" && passesOnWhite ? `, ${t("colors.shades.aaOnWhite")}` : ""}`}
              title={`${token} · ${value}`}
              className="flex w-full flex-col justify-end gap-1 p-2 text-left transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-current/40 focus-visible:ring-inset focus-visible:outline-none"
              style={{ background: toHex(shade.color), color: text }}
            >
              {size === "lg" ? (
                <>
                  <span className="flex items-center gap-1 text-xs font-medium">
                    {shade.step}
                    {shade.step === anchorStep ? (
                      <span className="size-1.5 rounded-full bg-current" aria-label={t("colors.shades.baseMarker")} />
                    ) : null}
                  </span>{" "}
                  <span className="hidden font-mono text-[10px] uppercase opacity-80 xl:block">
                    {toHex(shade.color).slice(1)}
                  </span>{" "}
                  <span className="hidden text-[10px] opacity-70 xl:block">
                    {passesOnWhite ? t("colors.shades.aaOnWhite") : ""}
                  </span>
                </>
              ) : (
                <span className="sr-only">{shade.step}</span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
