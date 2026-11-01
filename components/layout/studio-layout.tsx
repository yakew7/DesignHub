"use client";

import { Layers, SlidersHorizontal, SquareCode } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { useGroupRef, type Layout, type LayoutChangedMeta } from "react-resizable-panels";

import { useI18n } from "@/components/layout/locale-provider";
import { ResizableGroup, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { usePaneStore } from "@/store/pane-store";
import { NO_SWIPE, paneAfterSwipe, type Point } from "@/lib/swipe";
import { STUDIO_OUTPUT_ID, STUDIO_PANE_EVENT, STUDIO_PREVIEW_ID, type StudioPane } from "@/lib/studio-panes";
import { paneRestoreScript, paneRestoreStyleId, readPaneLayout, writePaneLayout } from "@/lib/pane-layout";
import { cn } from "@/lib/utils";

type StudioLayoutProps = {
  /** Unique per studio so each keeps its own panel sizes. */
  id: string;
  controls: ReactNode;
  preview: ReactNode;
  /** Omit for a two-pane layout where the preview column holds its own controls. */
  output?: ReactNode;
  className?: string;
};

/** Below `lg` only the open pane shows, and the bar at the bottom switches between them. */
const hiddenOnPhone = (open: StudioPane, pane: StudioPane) => (open === pane ? undefined : "max-lg:hidden");

const paneTabs = [
  { pane: "controls", label: "studio.pane.controls", icon: SlidersHorizontal },
  { pane: "preview", label: "studio.pane.preview", icon: Layers },
  { pane: "output", label: "studio.pane.output", icon: SquareCode },
] as const;

const panelClass = "flex h-full min-h-0 flex-col gap-4 overflow-y-auto scrollbar-thin lg:px-1 lg:pb-1";

/** Tailwind's `lg`, where the panes sit side by side and can be resized. */
const RESIZABLE_FROM = "64rem";

/**
 * Three-pane studio layout: controls · live preview · code & exports (or two panes without `output`).
 * Resizable (mouse, touch and arrow keys) from `lg` up; on a phone one pane at a time, with a bar to switch.
 * Sizes are remembered per studio in localStorage, and a double click on a divider resets it.
 * react-resizable-panels sets its sizing inline, so both layouts override it with `!important`.
 */
export function StudioLayout({ id, controls, preview, output, className }: StudioLayoutProps) {
  const { t } = useI18n();
  const groupRef = useGroupRef();
  const open = usePaneStore((state) => state.open[id]) ?? "controls";
  const setPane = usePaneStore((state) => state.setPane);
  const [announcement, setAnnouncement] = useState("");
  const setOpen = useCallback(
    (pane: StudioPane) => {
      setPane(id, pane);
      // Said after a change the person made, never on load.
      setAnnouncement(t("studio.pane.shown", { pane: t(`studio.pane.${pane}`) }));
    },
    [id, setPane, t],
  );
  const panelIds = output ? [`${id}-controls`, `${id}-preview`, `${id}-output`] : [`${id}-controls`, `${id}-preview`];
  const panelKey = panelIds.join(",");

  // Storage is read only after mount so the server and hydration renders agree. The inline
  // script below has already sized the panes before first paint; this hands that over to the library.
  useLayoutEffect(() => {
    const saved = readPaneLayout(id, panelKey.split(","));
    if (saved) groupRef.current?.setLayout(saved);
    const frame = requestAnimationFrame(() => document.getElementById(paneRestoreStyleId(id))?.remove());
    return () => cancelAnimationFrame(frame);
  }, [id, panelKey, groupRef]);

  // The skip links ask for a pane that a phone may be hiding.
  useEffect(() => {
    const show = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        (event.detail === "controls" || event.detail === "preview" || event.detail === "output")
      ) {
        setOpen(event.detail);
      }
    };
    window.addEventListener(STUDIO_PANE_EVENT, show);
    return () => window.removeEventListener(STUDIO_PANE_EVENT, show);
  }, [setOpen]);

  // Pointer drags and keyboard resizes count as user interaction; mount and window resizes don't.
  const save = useCallback(
    (layout: Layout, meta: LayoutChangedMeta) => {
      if (meta.isUserInteraction) writePaneLayout(id, layout);
    },
    [id],
  );

  // The library resets the divider's panel to its default size on double click; remember that too.
  const saveAfterReset = useCallback(() => {
    requestAnimationFrame(() => {
      const layout = groupRef.current?.getLayout();
      if (layout) writePaneLayout(id, layout);
    });
  }, [id, groupRef]);

  // A swipe sideways on a phone moves to the pane next to this one, as a shortcut for the bar below.
  const swipeStart = useRef<Point | null>(null);
  const paneOrder: StudioPane[] = output ? ["controls", "preview", "output"] : ["controls", "preview"];
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const blocked = event.target instanceof Element && event.target.closest(NO_SWIPE);
    swipeStart.current =
      event.touches.length === 1 && touch && !blocked ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    if (!start || !touch || !window.matchMedia("(max-width: 63.99rem)").matches) return;
    const next = paneAfterSwipe(paneOrder, open, start, { x: touch.clientX, y: touch.clientY });
    if (next !== open) setOpen(next);
  };

  return (
    <div className="contents" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <script
        // Runs during HTML parsing only; React never executes it on client renders, which is fine
        // because the layout effect above restores the sizes before paint there.
        dangerouslySetInnerHTML={{ __html: paneRestoreScript(id, panelIds, RESIZABLE_FROM) }}
        suppressHydrationWarning
      />
      <ResizableGroup
        id={id}
        groupRef={groupRef}
        onLayoutChanged={save}
        orientation="horizontal"
        className={cn(
          "lg:h-[calc(100dvh-13rem)]! lg:min-h-[560px]",
          "max-lg:h-auto! max-lg:flex-col! max-lg:gap-6 max-lg:overflow-visible! max-lg:pb-16",
          "max-lg:[&>[data-panel]]:basis-auto! max-lg:[&>[data-panel]]:grow-0! max-lg:[&>[data-separator]]:hidden!",
          className,
        )}
      >
        <ResizablePanel
          id={panelIds[0]}
          defaultSize="24%"
          minSize="220px"
          className={cn(panelClass, hiddenOnPhone(open, "controls"))}
        >
          <section aria-label={t("studio.pane.controls")} className="flex flex-col gap-4">
            {controls}
          </section>
        </ResizablePanel>
        <ResizableHandle aria-label={t("studio.pane.resizeControls")} onDoubleClick={saveAfterReset} />
        <ResizablePanel
          id={panelIds[1]}
          defaultSize={output ? "46%" : "76%"}
          minSize="320px"
          className={cn(panelClass, hiddenOnPhone(open, "preview"))}
        >
          <section
            id={STUDIO_PREVIEW_ID}
            tabIndex={-1}
            aria-label={t("studio.pane.preview")}
            className="flex min-h-0 flex-1 flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {preview}
          </section>
        </ResizablePanel>
        {output ? (
          <>
            <ResizableHandle aria-label={t("studio.pane.resizeCode")} onDoubleClick={saveAfterReset} />
            <ResizablePanel
              id={panelIds[2]}
              defaultSize="30%"
              minSize="260px"
              className={cn(panelClass, hiddenOnPhone(open, "output"))}
            >
              <section
                id={STUDIO_OUTPUT_ID}
                tabIndex={-1}
                aria-label={t("studio.pane.codeExports")}
                className="flex flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {output}
              </section>
            </ResizablePanel>
          </>
        ) : null}
      </ResizableGroup>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <nav
        aria-label={t("studio.pane.bar")}
        className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 backdrop-blur lg:hidden"
      >
        {paneTabs
          .filter((tab) => output || tab.pane !== "output")
          .map(({ pane, label, icon: Icon }) => (
            <button
              key={pane}
              type="button"
              aria-pressed={open === pane}
              onClick={() => setOpen(pane)}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                open === pane ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(label)}
            </button>
          ))}
      </nav>
    </div>
  );
}
