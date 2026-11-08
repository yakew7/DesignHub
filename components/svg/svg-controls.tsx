"use client";

import { useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { ElementInspector } from "@/components/svg/element-inspector";
import { ElementTree } from "@/components/svg/element-tree";
import { OptimizePanel } from "@/components/svg/optimize-panel";
import { SpritePanel } from "@/components/svg/sprite-panel";
import { SvgDocumentPanel } from "@/components/svg/svg-document-panel";
import { ViewBoxEditor } from "@/components/svg/viewbox-editor";
import { Advanced, useIsAdvanced } from "@/components/ui/advanced";
import { Panel } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OptimizeResult } from "@/lib/svg/optimize";
import type { SvgNode } from "@/types/svg";

export function SvgControls({ root, optimized }: { root: SvgNode | null; optimized: OptimizeResult | null }) {
  const { t } = useI18n();
  const advanced = useIsAdvanced();
  const [tab, setTab] = useState("document");
  // Layers and Sprite are Advanced tools: leaving Advanced while one is open returns to Document.
  const shown = !advanced && (tab === "layers" || tab === "sprite") ? "document" : tab;

  return (
    <Tabs value={shown} onValueChange={setTab} className="gap-4">
      <TabsList aria-label={t("svg.tabs.label")} className="w-full">
        <TabsTrigger value="document" className="px-1.5 text-xs">
          {t("svg.tab.document")}
        </TabsTrigger>
        <Advanced>
          <TabsTrigger value="layers" className="px-1.5 text-xs" disabled={!root}>
            {t("svg.tab.layers")}
          </TabsTrigger>
        </Advanced>
        <TabsTrigger value="optimize" className="px-1.5 text-xs" disabled={!root}>
          {t("svg.tab.optimize")}
        </TabsTrigger>
        <Advanced>
          <TabsTrigger value="sprite" className="px-1.5 text-xs">
            {t("svg.tab.sprite")}
          </TabsTrigger>
        </Advanced>
      </TabsList>
      <TabsContent value="document" className="flex flex-col gap-4">
        <SvgDocumentPanel />
        {root ? <ViewBoxEditor root={root} /> : null}
      </TabsContent>
      <TabsContent value="layers">
        {root ? (
          <Panel title={t("svg.tab.layers")} description={t("svg.layers.description")}>
            <ElementTree root={root} />
            <ElementInspector root={root} />
          </Panel>
        ) : null}
      </TabsContent>
      <TabsContent value="optimize">{root ? <OptimizePanel result={optimized} /> : null}</TabsContent>
      <TabsContent value="sprite">
        <SpritePanel />
      </TabsContent>
    </Tabs>
  );
}
