"use client";

import { useState } from "react";

import { A11yColorsPanel } from "@/components/accessibility/a11y-colors-panel";
import { VisionFilters } from "@/components/accessibility/vision-filters";
import { VisionPanel } from "@/components/accessibility/vision-panel";
import { VisionPreview } from "@/components/accessibility/vision-preview";
import { ContrastResults } from "@/components/accessibility/contrast-results";
import { FocusIndicatorResults } from "@/components/accessibility/focus-indicator-results";
import { GradientContrastResults } from "@/components/accessibility/gradient-contrast-results";
import { ReadabilityPanel } from "@/components/accessibility/readability-panel";
import { TargetsPanel } from "@/components/accessibility/targets-panel";
import { TargetsPreview } from "@/components/accessibility/targets-preview";
import { A11yTypePanel } from "@/components/accessibility/a11y-type-panel";
import { A11yReportPanel } from "@/components/accessibility/a11y-report-panel";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoogleFonts } from "@/hooks/use-google-font";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { useA11yReport } from "@/hooks/use-a11y-report";
import { useA11yStore } from "@/store/a11y-store";
import type { A11yTab } from "@/types/a11y";

const tabs: { value: A11yTab; label: string }[] = [
  { value: "contrast", label: "Contrast" },
  { value: "vision", label: "Vision" },
  { value: "readability", label: "Reading" },
  { value: "targets", label: "Targets" },
];

export function A11yWorkspace() {
  const tab = useA11yStore((state) => state.tab);
  const setTab = useA11yStore((state) => state.setTab);
  const typography = useA11yStore((state) => state.typography);
  useGoogleFonts([useFontMeta(typography.family)]);
  const [compare, setCompare] = useState(false);

  const report = useA11yReport();

  return (
    <StudioLayout
      id="accessibility"
      controls={
        <Tabs value={tab} onValueChange={(value) => setTab(value as A11yTab)} className="gap-4">
          <TabsList aria-label="Accessibility tools" className="w-full">
            {tabs.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="px-1.5 text-xs">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="contrast" className="flex flex-col gap-4">
            <A11yColorsPanel />
            <ContrastResults />
            <FocusIndicatorResults />
            <GradientContrastResults />
          </TabsContent>
          <TabsContent value="vision" className="flex flex-col gap-4">
            <VisionPanel compare={compare} onCompareChange={setCompare} />
          </TabsContent>
          <TabsContent value="readability" className="flex flex-col gap-4">
            <A11yTypePanel />
            <ReadabilityPanel />
          </TabsContent>
          <TabsContent value="targets" className="flex flex-col gap-4">
            <TargetsPanel />
          </TabsContent>
        </Tabs>
      }
      preview={
        <>
          <VisionFilters />
          {tab === "targets" ? <TargetsPreview /> : null}
          <VisionPreview compare={compare} />
        </>
      }
      output={<A11yReportPanel report={report} />}
    />
  );
}
