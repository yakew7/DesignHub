"use client";

import { useMemo } from "react";

import { ExportPanel } from "@/components/export/export-panel";
import { useBrandTokens } from "@/hooks/use-brand";
import { useDesignTokens } from "@/hooks/use-design-tokens";
import { brandJson } from "@/lib/brand/json";
import { tokenFormats } from "@/lib/tokens/formats";
import { useBrandStore } from "@/store/brand-store";
import type { ExportFormat } from "@/types/export";

/** The same tokens the Export Engine ships, plus the portable brand JSON, live for the current brand. */
export function BrandTokensPanel() {
  const tokens = useDesignTokens();
  const brand = useBrandTokens();
  const voice = useBrandStore((state) => state.profile.voice);
  const mission = useBrandStore((state) => state.profile.mission);
  const formats = useMemo<ExportFormat[]>(
    () => [
      {
        id: "brand",
        label: "Brand JSON",
        filename: "brand.json",
        language: "json",
        code: brandJson(brand, voice, mission),
      },
      ...tokenFormats(tokens),
    ],
    [tokens, brand, voice, mission],
  );

  return (
    <>
      <h2 className="text-sm font-medium">Design tokens</h2>
      <ExportPanel formats={formats} label="Brand token format" />
    </>
  );
}
