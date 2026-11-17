"use client";

import "@/lib/i18n/areas/brand";

import type { CSSProperties } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import type { BrandSurface, BrandTokens } from "@/types/brand";

type BrandUiKitProps = { brand: BrandTokens; surface: BrandSurface; heading: CSSProperties };

/** Components drawn purely from brand tokens: radius, spacing, shadow and colors. */
export function BrandUiKit({ brand, surface, heading }: BrandUiKitProps) {
  const { t } = useI18n();
  const radius = brand.radius;
  const pad = `${brand.spacing}px ${brand.spacing * 2}px`;

  return (
    <section
      aria-label={t("brand.kit.label")}
      className="grid gap-6 border-t p-6 md:grid-cols-2"
      style={{ borderColor: surface.border }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ background: surface.primary, color: surface.onPrimary, borderRadius: radius, padding: pad }}
          >
            {t("brand.kit.primary")}
          </span>
          <span
            className="border text-sm font-semibold"
            style={{ borderColor: surface.border, borderRadius: radius, padding: pad }}
          >
            {t("brand.kit.secondary")}
          </span>
          <span
            className="text-xs font-semibold"
            style={{
              background: `${surface.secondary}33`,
              color: surface.text,
              borderRadius: 999,
              padding: "2px 10px",
            }}
          >
            {t("brand.kit.badge")}
          </span>
        </div>
        <span
          className="flex items-center border text-sm"
          style={{ borderColor: surface.border, borderRadius: radius, padding: pad, color: surface.muted }}
          aria-hidden
        >
          name@{brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand"}.com
        </span>
        <div className="flex items-end gap-1.5" aria-label={t("brand.kit.spacing")}>
          {[1, 2, 3, 4, 6, 8].map((step) => (
            <span key={step} className="flex flex-col items-center gap-1">
              <span
                style={{
                  width: brand.spacing * step,
                  height: brand.spacing * step,
                  background: surface.primary,
                  opacity: 0.25 + step / 12,
                  borderRadius: Math.min(radius, 6),
                }}
              />
              <span className="font-mono text-[10px]" style={{ color: surface.muted }}>
                {brand.spacing * step}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div
        className="flex flex-col gap-2 p-5"
        style={{ background: surface.surface, borderRadius: radius * 1.5, boxShadow: brand.shadow }}
      >
        <span className="text-xs" style={{ color: surface.muted }}>
          {t("brand.kit.metric")}
        </span>
        <span className="text-3xl" style={heading}>
          $48,210
        </span>
        <span className="h-2 overflow-hidden" style={{ background: surface.border, borderRadius: 999 }}>
          <span className="block h-full w-2/3" style={{ background: brand.gradient }} />
        </span>
        <span className="text-xs" style={{ color: surface.muted }}>
          {t("brand.kit.goal", { radius, spacing: brand.spacing })}
        </span>
      </div>
    </section>
  );
}
