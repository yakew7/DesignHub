"use client";

import "@/lib/i18n/areas/brand";

import dynamic from "next/dynamic";
import { useRef } from "react";

import { AssetExports } from "@/components/export/asset-exports";
import { TokenOutput } from "@/components/export/token-output";
import { TokenPreview } from "@/components/export/token-preview";
import { TokenSettingsPanel } from "@/components/export/token-settings";
import { TokenSources } from "@/components/export/token-sources";
import { useI18n } from "@/components/layout/locale-provider";
import { useDesignTokens } from "@/hooks/use-design-tokens";

// Brand assets embed fonts and render logos; load them after the token tools are interactive.
const BrandAssetExports = dynamic(
  () => import("@/components/export/brand-asset-exports").then((m) => m.BrandAssetExports),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg border bg-surface-raised" /> },
);

export function ExportEngine() {
  const { t } = useI18n();
  const tokens = useDesignTokens();
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <TokenSources tokens={tokens} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label={t("brand.preview.title")} className="flex min-w-0 flex-col gap-3">
          <h2 className="text-sm font-medium">{t("brand.preview.title")}</h2>
          <TokenPreview ref={previewRef} tokens={tokens} />
        </section>
        <TokenSettingsPanel />
      </div>
      <TokenOutput tokens={tokens} previewRef={previewRef} />
      <BrandAssetExports />
      <AssetExports />
    </div>
  );
}
