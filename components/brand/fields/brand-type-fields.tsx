"use client";

import "@/lib/i18n/areas/brand";

import { useI18n } from "@/components/layout/locale-provider";
import { FontPicker } from "@/components/typography/font-picker";
import { Label } from "@/components/ui/label";
import { useFontIndex } from "@/hooks/use-font-catalog";
import { useTypographyStore } from "@/store/typography-store";

export function BrandTypeFields() {
  const { t } = useI18n();
  const { fonts } = useFontIndex();
  const headingFont = useTypographyStore((state) => state.headingFont);
  const bodyFont = useTypographyStore((state) => state.bodyFont);
  const setPair = useTypographyStore((state) => state.setPair);

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>{t("brand.type.heading")}</Label>
        <FontPicker
          label={t("brand.type.heading")}
          value={headingFont}
          fonts={fonts}
          onChange={(heading) => setPair({ heading })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("brand.type.body")}</Label>
        <FontPicker
          label={t("brand.type.body")}
          value={bodyFont}
          fonts={fonts}
          onChange={(body) => setPair({ body })}
        />
      </div>
    </div>
  );
}
