"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { LazyOverlays } from "@/components/layout/lazy-overlays";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { PwaRegister } from "@/components/layout/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <LocaleProvider>
        <TooltipProvider>
          {children}
          <LazyOverlays />
          <PwaRegister />
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
