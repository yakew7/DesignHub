"use client";

import { useCallback, useLayoutEffect, type ReactNode } from "react";
import { useGroupRef, type Layout, type LayoutChangedMeta } from "react-resizable-panels";

import { ResizableGroup, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
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

const panelClass = "flex h-full min-h-0 flex-col gap-4 overflow-y-auto scrollbar-thin lg:px-1 lg:pb-1";

/** Tailwind's `lg`, where the panes sit side by side and can be resized. */
const RESIZABLE_FROM = "64rem";

/**
 * Three-pane studio layout: controls · live preview · code & exports (or two panes without `output`).
 * Resizable (mouse, touch and arrow keys) from `lg` up; stacked on smaller screens.
 * Sizes are remembered per studio in localStorage, and a double click on a divider resets it.
 * react-resizable-panels sets its sizing inline, so both layouts override it with `!important`.
 */
export function StudioLayout({ id, controls, preview, output, className }: StudioLayoutProps) {
  const groupRef = useGroupRef();
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

  return (
    <>
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
          "max-lg:h-auto! max-lg:flex-col! max-lg:gap-6 max-lg:overflow-visible!",
          "max-lg:[&>[data-panel]]:basis-auto! max-lg:[&>[data-panel]]:grow-0! max-lg:[&>[data-separator]]:hidden!",
          className,
        )}
      >
        <ResizablePanel id={panelIds[0]} defaultSize="24%" minSize="220px" className={panelClass}>
          <section aria-label="Controls" className="flex flex-col gap-4">
            {controls}
          </section>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize controls panel" onDoubleClick={saveAfterReset} />
        <ResizablePanel id={panelIds[1]} defaultSize={output ? "46%" : "76%"} minSize="320px" className={panelClass}>
          <section aria-label="Preview" className="flex min-h-0 flex-1 flex-col gap-4">
            {preview}
          </section>
        </ResizablePanel>
        {output ? (
          <>
            <ResizableHandle aria-label="Resize code panel" onDoubleClick={saveAfterReset} />
            <ResizablePanel id={panelIds[2]} defaultSize="30%" minSize="260px" className={panelClass}>
              <section aria-label="Code and exports" className="flex flex-col gap-4">
                {output}
              </section>
            </ResizablePanel>
          </>
        ) : null}
      </ResizableGroup>
    </>
  );
}
