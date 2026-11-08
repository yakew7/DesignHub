"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";

import { isPanelOpen } from "@/lib/panel-state";
import { cn } from "@/lib/utils";
import { usePanelStore } from "@/store/panel-store";

/** One fold inside a panel. Its state is remembered by `id` like a panel's, so the sections a person opens stay open. */
export function Section({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const bodyId = useId();
  const chosen = usePanelStore((state) => state.open[id]);
  const setOpen = usePanelStore((state) => state.setOpen);
  const open = isPanelOpen(true, chosen, defaultOpen);
  return (
    <section className="flex flex-col gap-2 border-t pt-2 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-medium">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(id, !open)}
          className="flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
            aria-hidden
          />
          {title}
        </button>
      </h3>
      <div id={bodyId} hidden={!open} className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}
