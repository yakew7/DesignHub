"use client";

import "@/lib/i18n/areas/brand";

import { Plus } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrandTokens } from "@/hooks/use-brand";
import { parseColor } from "@/lib/color/color";
import { randomColor } from "@/lib/color/generate";
import { useBrandStore } from "@/store/brand-store";
import { MAX_SWATCHES, useColorStore } from "@/store/color-store";
import type { ColorRole } from "@/types/brand";

const roles: ColorRole[] = ["primary", "secondary", "neutral"];

/** Palette colors live in Color Studio; this edits them in place and assigns brand roles. */
export function BrandColorsField() {
  const { t } = useI18n();
  const brand = useBrandTokens();
  const setRole = useBrandStore((state) => state.setRole);
  const updateColor = useColorStore((state) => state.updateColor);
  const addSwatch = useColorStore((state) => state.addSwatch);
  const count = useColorStore((state) => state.swatches.length);

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("brand.colors.label")}</Label>
      <ul className="flex flex-col gap-1.5" aria-label={t("brand.colors.list")}>
        {brand.colors.all.map((color) => (
          <li key={color.id} className="flex items-center gap-2">
            <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border">
              <span className="absolute inset-0" style={{ background: color.hex }} />
              <input
                type="color"
                aria-label={t("brand.colors.picker", { name: color.name })}
                value={color.hex}
                onChange={(event) => {
                  const next = parseColor(event.target.value);
                  if (next) updateColor(color.id, next);
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <span className="min-w-0 flex-1 truncate font-mono text-xs uppercase">{color.hex}</span>
            <Select value={color.role} onValueChange={(value) => setRole(color.id, value as ColorRole)}>
              <SelectTrigger size="sm" className="w-28" aria-label={t("brand.colors.role", { name: color.name })}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`brand.role.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" disabled={count >= MAX_SWATCHES} onClick={() => addSwatch(randomColor())}>
        <Plus /> {t("brand.colors.add")}
      </Button>
    </div>
  );
}
