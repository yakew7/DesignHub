"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { LazyOverlays } from "@/components/layout/lazy-overlays";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { PwaRegister } from "@/components/layout/pwa-register";
import { LazyToaster } from "@/components/layout/lazy-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Marks the page as hydrated: the app's own handlers are attached from now on, and a click before this does
 * nothing. The end-to-end tests wait for it (`hydrated(page)` in tests/e2e/storage.ts); it has no other use.
 */
function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <LocaleProvider>
        <TooltipProvider>
          {children}
          <LazyOverlays />
          <PwaRegister />
          <LazyToaster />
          <HydrationMarker />
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
