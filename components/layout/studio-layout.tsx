"use client";

import type { ReactNode } from "react";

import { ResizableGroup, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
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

/**
 * Three-pane studio layout: controls · live preview · code & exports (or two panes without `output`).
 * Resizable (mouse, touch and arrow keys) from `lg` up; stacked on smaller screens.
 * react-resizable-panels sets its sizing inline, so both layouts override it with `!important`.
 */
export function StudioLayout({ id, controls, preview, output, className }: StudioLayoutProps) {
  return (
    <ResizableGroup
      id={id}
      orientation="horizontal"
      className={cn(
        "lg:h-[calc(100dvh-13rem)]! lg:min-h-[560px]",
        "max-lg:h-auto! max-lg:flex-col! max-lg:gap-6 max-lg:overflow-visible!",
        "max-lg:[&>[data-panel]]:basis-auto! max-lg:[&>[data-panel]]:grow-0! max-lg:[&>[data-separator]]:hidden!",
        className,
      )}
    >
      <ResizablePanel id={`${id}-controls`} defaultSize="24%" minSize="220px" className={panelClass}>
        <section aria-label="Controls" className="flex flex-col gap-4">
          {controls}
        </section>
      </ResizablePanel>
      <ResizableHandle aria-label="Resize controls panel" />
      <ResizablePanel id={`${id}-preview`} defaultSize={output ? "46%" : "76%"} minSize="320px" className={panelClass}>
        <section aria-label="Preview" className="flex min-h-0 flex-1 flex-col gap-4">
          {preview}
        </section>
      </ResizablePanel>
      {output ? (
        <>
          <ResizableHandle aria-label="Resize code panel" />
          <ResizablePanel id={`${id}-output`} defaultSize="30%" minSize="260px" className={panelClass}>
            <section aria-label="Code and exports" className="flex flex-col gap-4">
              {output}
            </section>
          </ResizablePanel>
        </>
      ) : null}
    </ResizableGroup>
  );
}
