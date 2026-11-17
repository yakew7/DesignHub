"use client";

import "@/lib/i18n/areas/brand";

import { Moon, Sun } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { BrandUiKit } from "@/components/brand/brand-ui-kit";
import { useI18n } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBrandTokens } from "@/hooks/use-brand";
import { useBrandFonts } from "@/hooks/use-brand-fonts";
import { brandSurface } from "@/lib/brand/theme";
import { fontStack } from "@/lib/typography/css";
import type { BrandMode } from "@/types/brand";

export function BrandPreview() {
  const { t } = useI18n();
  const brand = useBrandTokens();
  useBrandFonts(brand);
  const [mode, setMode] = useState<BrandMode>("light");
  const surface = useMemo(() => brandSurface(brand, mode), [brand, mode]);

  const heading: CSSProperties = {
    fontFamily: fontStack(brand.typography.heading, brand.typography.headingCategory),
    fontWeight: brand.typography.headingWeight,
    lineHeight: brand.typography.headingLineHeight,
  };
  const body: CSSProperties = {
    fontFamily: fontStack(brand.typography.body, brand.typography.bodyCategory),
    fontWeight: brand.typography.bodyWeight,
    lineHeight: brand.typography.bodyLineHeight,
  };
  const gap = brand.spacing * 2;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t("brand.preview.title")}</h2>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as BrandMode)}
          aria-label={t("brand.preview.theme")}
        >
          <ToggleGroupItem value="light" aria-label={t("brand.preview.light")}>
            <Sun /> {t("brand.preview.light")}
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label={t("brand.preview.dark")}>
            <Moon /> {t("brand.preview.dark")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <article
        aria-label={t("brand.preview.label", { name: brand.name })}
        className="flex flex-col overflow-hidden border"
        style={{
          background: surface.background,
          color: surface.text,
          borderRadius: brand.radius + 4,
          borderColor: surface.border,
          ...body,
        }}
      >
        <header className="flex flex-col gap-4 p-8" style={{ background: brand.gradient }}>
          <div className="flex items-center gap-3">
            <BrandLogo
              svg={brand.logo.svg}
              alt={t("brand.preview.logoAlt", { name: brand.name })}
              className="size-14 rounded-lg bg-white/90 p-1.5"
            />
            <span className="text-3xl text-white drop-shadow-sm" style={heading}>
              {brand.name}
            </span>
          </div>
          <p className="max-w-md text-white/90 drop-shadow-sm">{brand.description}</p>
        </header>

        <section
          aria-label={t("brand.preview.palette")}
          className="grid grid-cols-2 gap-2 p-6 sm:grid-cols-5"
          style={{ gap }}
        >
          {brand.colors.all.map((color) => (
            <div key={color.id} className="flex flex-col gap-1.5">
              <span
                className="h-14 border"
                style={{ background: color.hex, borderRadius: brand.radius, borderColor: surface.border }}
              />
              <span className="text-xs font-semibold capitalize">{t(`brand.role.${color.role}`)}</span>
              <span className="font-mono text-[11px]" style={{ color: surface.muted }}>
                {color.hex.toUpperCase()}
              </span>
            </div>
          ))}
        </section>

        <section
          aria-label={t("brand.preview.typography")}
          className="grid gap-6 border-t p-6 md:grid-cols-2"
          style={{ borderColor: surface.border }}
        >
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: surface.primaryText }}>
              {t("brand.preview.headingFont", { font: brand.typography.heading })}
            </span>
            <span className="text-5xl" style={heading}>
              Aa Bb Cc
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: surface.primaryText }}>
              {t("brand.preview.bodyFont", { font: brand.typography.body })}
            </span>
            <p style={{ color: surface.muted }}>{brand.description || t("brand.preview.bodyCopy")}</p>
          </div>
        </section>

        <BrandUiKit brand={brand} surface={surface} heading={heading} />
      </article>
    </>
  );
}
