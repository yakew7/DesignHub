"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useRef } from "react";

import { StudioLink as Link } from "@/components/layout/studio-link";
import { useI18n } from "@/components/layout/locale-provider";
import { isActivePath, type studios } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** The header's More menu. It is loaded on first use (main-nav.tsx), so Radix's menu is not in the first load of a page. */
export function MainNavMore({
  trigger,
  triggerClass,
  overflow,
  pathname,
  open,
  keyboard,
  onOpenChange,
}: {
  trigger: string;
  triggerClass: string;
  overflow: typeof studios;
  pathname: string;
  open: boolean;
  /** Opened with a key: focus goes to the first item, as Radix does when it owns the trigger. */
  keyboard: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const content = useRef<HTMLDivElement>(null);
  // Radix focuses the first item for a menu it opened from a key itself; this one was opened by the plain button
  // before Radix was here, so it is done once the content is on screen.
  useEffect(() => {
    if (!open || !keyboard) return;
    const frame = requestAnimationFrame(() =>
      content.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open, keyboard]);
  return (
    <DropdownMenu.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger className={triggerClass}>
        {trigger}
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={content}
          align="end"
          sideOffset={6}
          className="z-50 min-w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {overflow.map((studio) => {
            const active = isActivePath(pathname, studio.href);
            return (
              <DropdownMenu.Item key={studio.id} asChild>
                <Link
                  href={studio.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground outline-none data-[highlighted]:bg-accent data-[highlighted]:text-foreground",
                    active && "font-medium text-foreground",
                  )}
                >
                  {t(`studio.${studio.id}.short`)}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
