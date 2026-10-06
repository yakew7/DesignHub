"use client";

import type { RefObject } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type MobileNavSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu button, which gets focus back when the sheet closes. */
  triggerRef: RefObject<HTMLButtonElement | null>;
};

/** The navigation sheet behind the mobile menu button, loaded the first time it opens. */
export function MobileNavSheet({ open, onOpenChange, triggerRef }: MobileNavSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="mobile-nav"
        side="left"
        className="pt-12"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Jump to a DesignHub studio.</SheetDescription>
        <SidebarNav onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
