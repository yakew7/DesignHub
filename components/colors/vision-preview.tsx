"use client";

import "@/lib/i18n/areas/colors";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { toHex } from "@/lib/color/color";
import { simulateVision, visionTypes } from "@/lib/color/vision";
import { useColorStore } from "@/store/color-store";

/** The palette and the current contrast pair as seen with each type of color vision deficiency. */
export function VisionPreview() {
  const { t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const { fg, bg } = useColorStore((state) => state.contrast);

  const rows = useMemo(
    () =>
      visionTypes.map((type) => ({
        ...type,
        palette: swatches.map((swatch) => toHex(simulateVision(swatch.color, type.value))),
        fg: toHex(simulateVision(fg, type.value)),
        bg: toHex(simulateVision(bg, type.value)),
      })),
    [swatches, fg, bg],
  );

  return (
    <section aria-labelledby="vision-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="vision-title" className="text-lg font-medium">
          {t("colors.vision.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("colors.vision.description")}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <li key={row.value} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-sans text-sm font-medium">{t(`colors.vision.${row.value}` as const)}</h3>
              <span className="text-[11px] text-subtle-foreground">
                {t(`colors.vision.${row.value}.description` as const)}
              </span>
            </div>
            <div className="flex h-10 overflow-hidden rounded-md" aria-hidden>
              {row.palette.map((hex, index) => (
                <span key={index} className="flex-1" style={{ background: hex }} />
              ))}
            </div>
            <div
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{ background: row.bg, color: row.fg }}
              aria-hidden
            >
              {t("colors.vision.sample")}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
