"use client";

import "@/lib/i18n/areas/colors";

import { HarmonyWheel } from "@/components/colors/harmony-wheel";
import { useI18n } from "@/components/layout/locale-provider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { harmonyModes } from "@/lib/color/harmony";
import { useColorStore } from "@/store/color-store";
import type { HarmonyMode } from "@/types/color";

export function HarmonyPanel({ onApply }: { onApply: () => void }) {
  const { t } = useI18n();
  const harmony = useColorStore((state) => state.harmony);
  const setHarmony = useColorStore((state) => state.setHarmony);
  const swatches = useColorStore((state) => state.swatches);
  const anchor = swatches.find((swatch) => swatch.locked);

  return (
    <section
      aria-label={t("colors.harmony.label")}
      className="flex flex-col items-center gap-6 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"
    >
      <HarmonyWheel colors={swatches.map((swatch) => swatch.color)} />
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="harmony-mode">{t("colors.harmony.mode")}</Label>
          <Select
            value={harmony}
            onValueChange={(value) => {
              setHarmony(value as HarmonyMode);
              // Apply immediately so the choice is visible, not just remembered.
              queueMicrotask(onApply);
            }}
          >
            <SelectTrigger id="harmony-mode" className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {harmonyModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {t(`colors.harmony.${mode.value}` as const)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{t(`colors.harmony.${harmony}.description` as const)}</p>
        <p className="text-xs text-subtle-foreground">
          {anchor ? t("colors.harmony.anchored") : t("colors.harmony.tip")}
        </p>
      </div>
    </section>
  );
}
