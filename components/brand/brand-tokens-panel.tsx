"use client";

import "@/lib/i18n/areas/colors";
import "@/lib/i18n/areas/brand";

import { useCallback, useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { ExportPanel, type ExportPanelFormat } from "@/components/export/export-panel";
import { useBrandTokens } from "@/hooks/use-brand";
import { useDesignTokens } from "@/hooks/use-design-tokens";
import { brandJson } from "@/lib/brand/json";
import { tokenFormat, tokenFormatList } from "@/lib/tokens/formats";
import { useBrandStore } from "@/store/brand-store";

/** The formats whose names have a message. The others keep the name they have in the format table. */
const formatKeys: Partial<Record<string, "colors.export.format.css" | "colors.export.format.json">> = {
  css: "colors.export.format.css",
  json: "colors.export.format.json",
};

/** The same tokens the Export Engine ships, plus the portable brand JSON, live for the current brand. */
export function BrandTokensPanel() {
  const { t } = useI18n();
  const tokens = useDesignTokens();
  const brand = useBrandTokens();
  const voice = useBrandStore((state) => state.profile.voice);
  const mission = useBrandStore((state) => state.profile.mission);
  const formats = useMemo<ExportPanelFormat[]>(
    () => [
      { id: "brand", label: "Brand JSON", filename: "brand.json", language: "json" },
      ...tokenFormatList(tokens).map((format) => {
        const key = formatKeys[format.id];
        return key ? { ...format, label: t(key) } : format;
      }),
    ],
    [tokens, t],
  );
  const renderCode = useCallback(
    (id: string) => (id === "brand" ? brandJson(brand, voice, mission) : (tokenFormat(tokens, id)?.code ?? "")),
    [tokens, brand, voice, mission],
  );

  return (
    <>
      <h2 className="text-sm font-medium">{t("brand.tokens.title")}</h2>
      <ExportPanel formats={formats} renderCode={renderCode} label={t("brand.tokens.formatLabel")} />
    </>
  );
}
