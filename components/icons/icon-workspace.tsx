"use client";

import dynamic from "next/dynamic";
import { Braces, Globe, LayoutGrid } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { IconControls } from "@/components/icons/icon-controls";
import { IconLibrary } from "@/components/icons/icon-library";
import { IconPreview } from "@/components/icons/icon-preview";
import { Panel } from "@/components/ui/panel";
import { TabSkeleton } from "@/components/ui/tab-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIconStore } from "@/store/icon-store";

// Secondary tabs are split out so the first tab paints fast.
const FaviconGenerator = dynamic(() => import("@/components/icons/favicon-generator").then((m) => m.FaviconGenerator), {
  loading: TabSkeleton,
});
const IconExport = dynamic(() => import("@/components/icons/icon-export").then((m) => m.IconExport), {
  loading: TabSkeleton,
});

type IconTab = "library" | "favicon" | "export";

export function IconWorkspace() {
  const [tab, setTab] = useState<IconTab>("library");
  const libraryRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  // Whether an icon had keyboard focus when the person last left the library, so it can be given back.
  const iconHadFocus = useRef(false);
  const query = useIconStore((state) => state.query);
  const prefix = useIconStore((state) => state.prefix);

  // A new search or collection is a new list: start it at the top.
  useEffect(() => {
    savedScroll.current = 0;
    iconHadFocus.current = false;
  }, [query, prefix]);

  // Set when the library is about to be shown again; the effect below puts the page and the focused icon back.
  const restore = useRef(false);
  useLayoutEffect(() => {
    if (tab !== "library" || !restore.current) return;
    restore.current = false;
    const stop = () => libraryRef.current?.querySelector<HTMLElement>('[data-index][tabindex="0"]');
    if (iconHadFocus.current && stop()) {
      // The tab triggers sit above the results, so the page is near the top when the person returns. The icon they
      // were on is the better anchor: bring it back into view, and give it focus once the click's own focus has settled
      // (a click on a tab trigger focuses the trigger after its handler has run).
      setTimeout(() => {
        stop()?.scrollIntoView({ block: "center" });
        stop()?.focus({ preventScroll: true });
      }, 0);
    } else {
      window.scrollTo(0, savedScroll.current);
    }
  }, [tab]);

  const changeTab = (next: IconTab) => {
    if (tab === "library" && next !== "library") {
      savedScroll.current = window.scrollY;
    }
    if (next === "library") restore.current = true;
    setTab(next);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Tabs value={tab} onValueChange={(value) => changeTab(value as IconTab)} className="min-w-0 gap-6">
        <TabsList aria-label="Icon tools" className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="library">
            <LayoutGrid /> Library
          </TabsTrigger>
          <TabsTrigger value="favicon">
            <Globe /> Favicon
          </TabsTrigger>
          <TabsTrigger value="export">
            <Braces /> Export
          </TabsTrigger>
        </TabsList>
        {/* Kept mounted while another tab shows, so its results, scroll position and focused icon are still there. */}
        <TabsContent
          ref={libraryRef}
          value="library"
          forceMount
          className="data-[state=inactive]:hidden"
          onFocusCapture={(event) => {
            iconHadFocus.current = event.target instanceof HTMLElement && event.target.hasAttribute("data-index");
          }}
        >
          <IconLibrary />
        </TabsContent>
        <TabsContent value="favicon">
          <FaviconGenerator />
        </TabsContent>
        <TabsContent value="export">
          <IconExport />
        </TabsContent>
      </Tabs>
      <aside className="flex flex-col gap-4 scrollbar-thin lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pb-4">
        <Panel>
          <IconPreview />
        </Panel>
        <IconControls />
      </aside>
    </div>
  );
}
