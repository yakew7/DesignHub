"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Menu } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";

const loadSheet = () => import("@/components/layout/mobile-nav-sheet").then((m) => m.MobileNavSheet);

// The sheet (a modal dialog) is only needed once someone opens the menu, so it stays out of the
// first load of every page.
const MobileNavSheet = dynamic(loadSheet, { ssr: false });

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="-ml-2 lg:hidden"
        aria-label={t("nav.openMenu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "mobile-nav" : undefined}
        data-state={open ? "open" : "closed"}
        // Fetch the sheet as soon as the button is about to be used.
        onPointerEnter={() => void loadSheet()}
        onFocus={() => void loadSheet()}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
      >
        <Menu />
      </Button>
      {mounted ? <MobileNavSheet open={open} onOpenChange={setOpen} triggerRef={triggerRef} /> : null}
    </>
  );
}
