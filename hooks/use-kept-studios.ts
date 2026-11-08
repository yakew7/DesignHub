"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { studios } from "@/lib/navigation";

/**
 * The studios whose page is in the offline caches, so they open without a connection, and whether the browser is
 * offline now. Looked up again when the page changes (the worker keeps a studio a moment after it is shown) and
 * when the connection comes or goes. Empty where there is no service worker or no Cache Storage.
 */
export function useKeptStudios(): { kept: ReadonlySet<string>; offline: boolean; refresh: () => void } {
  const pathname = usePathname();
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set());
  const [offline, setOffline] = useState(false);
  const [tick, setTick] = useState(0);

  // The worker says when it has kept studios again after an update.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === "STUDIOS_REKEPT") setTick((value) => value + 1);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (typeof caches === "undefined") return;
    let current = true;
    const look = async () => {
      const found: (string | null)[] = await Promise.all(
        studios.map(async (studio) => ((await caches.match(studio.href, { ignoreSearch: true })) ? studio.href : null)),
      ).catch(() => []);
      if (current) setKept(new Set(found.filter((href): href is string => href !== null)));
    };
    void look();
    // A studio is kept a moment after it is shown, so look once more after that.
    const later = setTimeout(() => void look(), 2500);
    const update = () => {
      setOffline(!navigator.onLine);
      void look();
    };
    setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      current = false;
      clearTimeout(later);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [pathname, tick]);

  return { kept, offline, refresh: () => setTick((value) => value + 1) };
}
