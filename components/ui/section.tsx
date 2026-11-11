"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { isPanelOpen } from "@/lib/panel-state";
import { cn } from "@/lib/utils";
import { usePanelStore } from "@/store/panel-store";

/** The heading buttons of the sections next to this one, in order, so the arrow keys can move between them. */
function siblingToggles(button: HTMLButtonElement): HTMLButtonElement[] {
  const group = button.closest("section")?.parentElement;
  if (!group) return [button];
  return Array.from(group.querySelectorAll<HTMLButtonElement>(":scope > section > h3 > button[data-section-toggle]"));
}

/** Up and Down move to the previous and next section heading, Home and End to the first and last. */
function moveBetweenSections(event: KeyboardEvent<HTMLButtonElement>) {
  const toggles = siblingToggles(event.currentTarget);
  const index = toggles.indexOf(event.currentTarget);
  const target =
    event.key === "ArrowDown"
      ? toggles[(index + 1) % toggles.length]
      : event.key === "ArrowUp"
        ? toggles[(index - 1 + toggles.length) % toggles.length]
        : event.key === "Home"
          ? toggles[0]
          : event.key === "End"
            ? toggles.at(-1)
            : undefined;
  if (!target) return;
  event.preventDefault();
  target.focus();
}

/**
 * One fold inside a panel. Its state is remembered by `id` like a panel's, so the sections a person opens stay open.
 * Each heading is one tab stop; the arrow keys move between the headings of a group of sections, and a screen reader
 * hears "opened" or "closed" with the section's name when it is toggled.
 */
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
  const { t } = useI18n();
  const bodyId = useId();
  const chosen = usePanelStore((state) => state.open[id]);
  const setOpen = usePanelStore((state) => state.setOpen);
  const open = isPanelOpen(true, chosen, defaultOpen);
  // Empty until the person toggles the section, so restoring a remembered state announces nothing.
  const [announcement, setAnnouncement] = useState("");
  const toggle = () => {
    setOpen(id, !open);
    setAnnouncement(t(open ? "ui.section.closed" : "ui.section.opened", { name: title }));
  };
  return (
    <section className="flex flex-col gap-2 border-t pt-2 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-medium">
        <button
          type="button"
          data-section-toggle
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={toggle}
          onKeyDown={moveBetweenSections}
          className="flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
            aria-hidden
          />
          {title}
        </button>
      </h3>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <div id={bodyId} hidden={!open} className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}
