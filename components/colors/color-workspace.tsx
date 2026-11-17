"use client";

import "@/lib/i18n/areas/colors";

import dynamic from "next/dynamic";
import { Blend, Braces, Contrast, Layers, Palette } from "lucide-react";
import type { ReactNode } from "react";

import { HarmonyPanel } from "@/components/colors/harmony-panel";
import { OklchEditor } from "@/components/colors/oklch-editor";
import { FormatSwitcher } from "@/components/colors/format-switcher";
import { PaletteStrip } from "@/components/colors/palette-strip";
import { PaletteToolbar, usePaletteAnnouncement } from "@/components/colors/palette-toolbar";
import { PaletteLibrary } from "@/components/colors/palette-library";
import { SavedPalettes } from "@/components/colors/saved-palettes";
import { useI18n } from "@/components/layout/locale-provider";
import { TabSkeleton } from "@/components/ui/tab-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHarmonyGenerator } from "@/hooks/use-harmony";
import type { PlainMessageKey } from "@/lib/i18n/translate";
import { useColorStore, type ColorTab } from "@/store/color-store";

// Secondary tabs are split out so the first tab paints fast.
const ShadesStudio = dynamic(() => import("@/components/colors/shades-studio").then((m) => m.ShadesStudio), {
  loading: TabSkeleton,
});
const GradientStudio = dynamic(() => import("@/components/colors/gradient-studio").then((m) => m.GradientStudio), {
  loading: TabSkeleton,
});
const ContrastChecker = dynamic(() => import("@/components/colors/contrast-checker").then((m) => m.ContrastChecker), {
  loading: TabSkeleton,
});
const ContrastMatrix = dynamic(() => import("@/components/colors/contrast-matrix").then((m) => m.ContrastMatrix), {
  loading: () => null,
});
const VisionPreview = dynamic(() => import("@/components/colors/vision-preview").then((m) => m.VisionPreview), {
  loading: () => null,
});
const ColorExport = dynamic(() => import("@/components/colors/color-export").then((m) => m.ColorExport), {
  loading: TabSkeleton,
});

const tabs: { value: ColorTab; label: PlainMessageKey; icon: ReactNode }[] = [
  { value: "palette", label: "colors.tab.palette", icon: <Palette /> },
  { value: "shades", label: "colors.tab.shades", icon: <Layers /> },
  { value: "gradient", label: "colors.tab.gradient", icon: <Blend /> },
  { value: "contrast", label: "colors.tab.contrast", icon: <Contrast /> },
  { value: "export", label: "colors.tab.export", icon: <Braces /> },
];

const isTab = (value: string): value is ColorTab => tabs.some((tab) => tab.value === value);

export function ColorWorkspace() {
  const { t } = useI18n();
  const tab = useColorStore((state) => state.tab);
  const setTab = useColorStore((state) => state.setTab);
  const generate = useColorStore((state) => state.generate);
  const nextColors = useHarmonyGenerator();
  const { announce, message } = usePaletteAnnouncement();

  return (
    <Tabs value={tab} onValueChange={(value) => isTab(value) && setTab(value)} className="gap-6">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList aria-label={t("colors.tools")} className="w-full overflow-x-auto sm:w-fit">
          {tabs.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.icon}
              {t(item.label)}
            </TabsTrigger>
          ))}
        </TabsList>
        <FormatSwitcher />
      </div>

      <TabsContent value="palette" className="flex flex-col gap-6">
        <PaletteToolbar nextColors={nextColors} announce={announce} />
        <PaletteStrip />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <HarmonyPanel
            onApply={() => {
              generate(nextColors());
              announce("generated", useColorStore.getState().swatches);
            }}
          />
          <OklchEditor />
        </div>
        <SavedPalettes announce={announce} />
        <PaletteLibrary announce={announce} />
      </TabsContent>
      <TabsContent value="shades">
        <ShadesStudio />
      </TabsContent>
      <TabsContent value="gradient">
        <GradientStudio />
      </TabsContent>
      <TabsContent value="contrast" className="flex flex-col gap-10">
        <ContrastChecker />
        <ContrastMatrix />
        <VisionPreview />
      </TabsContent>
      <TabsContent value="export">
        <ColorExport />
      </TabsContent>
    </Tabs>
  );
}
