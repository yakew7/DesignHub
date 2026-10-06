"use client";

import dynamic from "next/dynamic";

import { BrandLinksPanel } from "@/components/brand/brand-links-panel";
import { BrandSettingsPanel } from "@/components/brand/brand-settings-panel";
import { StudioLayout } from "@/components/layout/studio-layout";

// Server-rendered as before, but their code (the preview and every token format) is split out,
// so it loads and hydrates after the controls instead of holding up the first load.
const BrandPreview = dynamic(() => import("@/components/brand/brand-preview").then((m) => m.BrandPreview));
const BrandTokensPanel = dynamic(() => import("@/components/brand/brand-tokens-panel").then((m) => m.BrandTokensPanel));

export function BrandWorkspace() {
  return (
    <StudioLayout
      id="brand"
      controls={
        <>
          <BrandSettingsPanel />
          <BrandLinksPanel />
        </>
      }
      preview={<BrandPreview />}
      output={<BrandTokensPanel />}
    />
  );
}
