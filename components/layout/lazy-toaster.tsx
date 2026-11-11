"use client";

import { lazy, Suspense, useEffect, useState } from "react";

import { onToasterWanted } from "@/lib/toast";

/** One loader for both the preload and the component, so the preload fetches exactly what mounting needs. */
const loadToaster = () => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster }));
const Toaster = lazy(loadToaster);

/** Mounts the toaster (and so loads sonner) when the first toast is raised, not with the page. */
export function LazyToaster() {
  const [wanted, setWanted] = useState(false);
  useEffect(() => onToasterWanted(() => setWanted(true)), []);

  // Fetch the toaster's code a moment after the page has loaded, while there is a connection and the main thread is
  // idle, so a toast raised offline (a studio that is not kept) can still be shown. It is only fetched, not mounted.
  useEffect(() => {
    let idle: number | undefined;
    const timer = setTimeout(() => {
      const fetchIt = () => void Promise.all([loadToaster(), import("sonner")]);
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(fetchIt, { timeout: 2000 });
      else fetchIt();
    }, 1000);
    return () => {
      clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);

  return wanted ? (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  ) : null;
}
