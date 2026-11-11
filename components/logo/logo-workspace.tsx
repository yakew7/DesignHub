"use client";

import "@/lib/i18n/areas/logo";

import { useMemo } from "react";

import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { StudioLayout } from "@/components/layout/studio-layout";
import { useI18n } from "@/components/layout/locale-provider";
import { LogoDocumentPanel } from "@/components/logo/logo-document-panel";
import { LogoExportPanel } from "@/components/logo/logo-export-panel";
import { LogoEditorPanel } from "@/components/logo/logo-editor-panel";
import { LogoGuidesPanel } from "@/components/logo/logo-guides-panel";
import { LogoVariants } from "@/components/logo/logo-variants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrandTokens } from "@/hooks/use-brand";
import { brandSurface } from "@/lib/brand/theme";
import { composeLogoWithGuides } from "@/lib/logo/compose";
import { useLogoStore } from "@/store/logo-store";

export function LogoWorkspace() {
  const { t } = useI18n();
  const brand = useBrandTokens();
  const guides = useLogoStore((state) => state.guides);
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const backdrop = useLogoStore((state) => state.backdrop);

  const composed = useMemo(() => {
    const background =
      backdrop === "light"
        ? brandSurface(brand, "light").background
        : backdrop === "dark"
          ? brandSurface(brand, "dark").background
          : backdrop === "brand"
            ? (brand.colors.primary[0] ?? null)
            : null;
    return composeLogoWithGuides(brand.logo.svg, { ...guides, clearSpaceRatio: clearSpace, background });
  }, [brand, guides, clearSpace, backdrop]);

  return (
    <StudioLayout
      id="logo"
      controls={
        <>
          <LogoDocumentPanel />
          <LogoGuidesPanel />
          <LogoEditorPanel />
        </>
      }
      preview={
        <Tabs defaultValue="guides" className="min-h-0 flex-1 gap-4">
          <TabsList aria-label={t("logo.views")}>
            <TabsTrigger value="guides">{t("logo.tab.guides")}</TabsTrigger>
            <TabsTrigger value="variants">{t("logo.tab.variants")}</TabsTrigger>
          </TabsList>
          <TabsContent value="guides" className="flex min-h-0 flex-col">
            <SvgPreviewCanvas svg={composed} label={`${brand.name} logo with guides`} />
          </TabsContent>
          <TabsContent value="variants">
            <LogoVariants />
          </TabsContent>
        </Tabs>
      }
      output={<LogoExportPanel />}
    />
  );
}
