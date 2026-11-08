"use client";

import dynamic from "next/dynamic";

import { useI18n } from "@/components/layout/locale-provider";
import { Panel } from "@/components/ui/panel";
import { isPanelOpen } from "@/lib/panel-state";
import { usePanelStore } from "@/store/panel-store";

const PANEL_ID = "projects-storage";

const StorageBody = dynamic(() => import("@/components/projects/storage-body").then((m) => m.StorageBody), {
  ssr: false,
  loading: () => <p className="text-xs text-muted-foreground">...</p>,
});

/** Sizes and counts of what DesignHub keeps. Folded at first, and its body is loaded only once it is opened. */
export function StoragePanel() {
  const { t } = useI18n();
  const chosen = usePanelStore((state) => state.open[PANEL_ID]);
  const open = isPanelOpen(true, chosen, false);
  return (
    <Panel
      id={PANEL_ID}
      collapsible
      defaultOpen={false}
      title={t("projects.storage.title")}
      description={t("projects.storage.description")}
    >
      {open ? <StorageBody /> : null}
    </Panel>
  );
}
