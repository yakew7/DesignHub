"use client";

import dynamic from "next/dynamic";
import { Braces, Combine, LayoutGrid, Ruler } from "lucide-react";
import type { ReactNode } from "react";

import { FontBrowser } from "@/components/typography/font-browser";
import { OpenTypeControls } from "@/components/typography/opentype-controls";
import { SpecimenControls } from "@/components/typography/specimen-controls";
import { SpecimenPreview } from "@/components/typography/specimen-preview";
import { WeightWaterfall } from "@/components/typography/weight-waterfall";
import { VariablePlayground } from "@/components/typography/variable-playground";
import { TabSkeleton } from "@/components/ui/tab-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFontCatalog } from "@/hooks/use-font-catalog";
import { useTypographyStore, type TypographyTab } from "@/store/typography-store";

// Secondary tabs are split out so the first tab paints fast.
const PairingStudio = dynamic(() => import("@/components/typography/pairing-studio").then((m) => m.PairingStudio), {
  loading: TabSkeleton,
});
const TypeScaleStudio = dynamic(
  () => import("@/components/typography/type-scale-studio").then((m) => m.TypeScaleStudio),
  { loading: TabSkeleton },
);
const TypographyExport = dynamic(
  () => import("@/components/typography/typography-export").then((m) => m.TypographyExport),
  { loading: TabSkeleton },
);
const FontInspector = dynamic(() => import("@/components/typography/font-inspector").then((m) => m.FontInspector), {
  loading: () => null,
});

const tabs: { value: TypographyTab; label: string; icon: ReactNode }[] = [
  { value: "browse", label: "Browse", icon: <LayoutGrid /> },
  { value: "pair", label: "Pairing", icon: <Combine /> },
  { value: "scale", label: "Type scale", icon: <Ruler /> },
  { value: "export", label: "Export", icon: <Braces /> },
];

function isTab(value: string): value is TypographyTab {
  return tabs.some((tab) => tab.value === value);
}

export function TypographyWorkspace() {
  const tab = useTypographyStore((state) => state.tab);
  const setTab = useTypographyStore((state) => state.setTab);
  const { fonts, loading } = useFontCatalog();

  return (
    <Tabs value={tab} onValueChange={(value) => isTab(value) && setTab(value)} className="gap-6">
      <TabsList aria-label="Typography tools" className="w-full overflow-x-auto sm:w-fit">
        {tabs.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.icon}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/*
        Desktop: fonts on the left, the specimen pinned top right and its controls scrolling below it,
        all within one screen. Mobile: specimen, then a scrollable font list, then controls.
      */}
      <TabsContent
        value="browse"
        className="grid gap-4 lg:h-[calc(100dvh-19rem)] lg:flex-none lg:min-h-[560px] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]"
      >
        <SpecimenPreview className="lg:col-start-2 lg:row-start-1" />
        <FontBrowser
          fonts={fonts}
          loading={loading}
          className="max-lg:h-[70dvh] lg:col-start-1 lg:row-span-2 lg:row-start-1"
        />
        <div className="relative flex min-h-0 flex-col gap-4 lg:col-start-2 lg:row-start-2 lg:overflow-y-auto lg:pr-1 scrollbar-thin">
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <SpecimenControls />
            <VariablePlayground />
          </div>
          <WeightWaterfall />
          <OpenTypeControls />
          <FontInspector />
        </div>
      </TabsContent>
      <TabsContent value="pair">
        <PairingStudio fonts={fonts} />
      </TabsContent>
      <TabsContent value="scale">
        <TypeScaleStudio fonts={fonts} />
      </TabsContent>
      <TabsContent value="export">
        <TypographyExport fonts={fonts} />
      </TabsContent>
    </Tabs>
  );
}
