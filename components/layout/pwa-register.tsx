"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { recentStudioHrefs } from "@/lib/offline-recent";
import { useCommandRecentsStore } from "@/store/command-recents-store";
import { useNavStore } from "@/store/nav-store";

/** How long after the load event to wait before registering the service worker. */
const REGISTER_DELAY = 3000;

export function PwaRegister() {
  const pathname = usePathname();
  const { t, plural } = useI18n();
  // The registration effect runs once; it reads the current translator through a ref.
  const words = useRef({ t, plural });
  words.current = { t, plural };
  const keepRecent = useNavStore((state) => state.keepRecent);
  const lastStudio = useNavStore((state) => state.lastStudio);
  const recent = useCommandRecentsStore((state) => state.recent);

  // The studios used last are kept for offline use on their own (a switch in the Storage panel turns it off). The
  // worker only downloads one it has not kept, and only one that was used, so nothing new is fetched for a studio
  // that was never opened.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    if (!keepRecent || !navigator.onLine) return;
    const controller = navigator.serviceWorker.controller;
    if (!controller) return;
    for (const pathname of recentStudioHrefs(lastStudio, recent))
      controller.postMessage({ type: "REMEMBER_ROUTE", pathname });
  }, [keepRecent, lastStudio, recent]);

  // The new worker says when it has downloaded the studios that were kept before the update.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null || (data as { type?: unknown }).type !== "STUDIOS_REKEPT") return;
      const kept = (data as { kept?: unknown }).kept;
      if (typeof kept === "number" && kept > 0) toast.success(plural("pwa.rekept", kept), { id: "studios-rekept" });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    // The worker may have finished before this page was listening, so ask once.
    navigator.serviceWorker.controller?.postMessage({ type: "STUDIOS_REKEPT_QUERY" });
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [plural]);

  // Tells the worker which page is showing, so it can keep that studio for offline use. A link followed inside
  // the app makes no request for the page, so the worker could not know otherwise.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.controller?.postMessage({ type: "REMEMBER_ROUTE", pathname });
  }, [pathname]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    let updateShown = false;

    /** How many studios the update will download again, asked of the waiting worker (0 when it does not answer). */
    const keptCount = (worker: ServiceWorker) =>
      new Promise<number>((resolve) => {
        const timer = setTimeout(() => finish(0), 1500);
        const finish = (count: number) => {
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener("message", listen);
          resolve(count);
        };
        const listen = (event: MessageEvent) => {
          const data: unknown = event.data;
          if (typeof data === "object" && data !== null && (data as { type?: unknown }).type === "KEPT_COUNT")
            finish(Number((data as { count?: unknown }).count) || 0);
        };
        navigator.serviceWorker.addEventListener("message", listen);
        worker.postMessage({ type: "KEPT_COUNT_QUERY" });
      });

    const showUpdate = async (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting || updateShown) return;

      updateShown = true;
      const kept = await keptCount(registration.waiting);
      toast(words.current.t("pwa.update.title"), {
        description: kept > 0 ? words.current.plural("pwa.update.kept", kept) : words.current.t("pwa.update.body"),
        duration: Infinity,
        action: {
          label: words.current.t("pwa.update.reload"),
          onClick: () => {
            const waiting = registration.waiting;
            if (!waiting) return;
            refreshing = true;
            waiting.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    const onControllerChange = () => {
      if (refreshing) window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              showUpdate(registration);
            }
          });
        });

        if (registration.waiting) showUpdate(registration);
        await registration.update();
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Installing downloads the shell (about a fifth of the whole app). Wait a moment after the page has
    // loaded and until the main thread is idle, so that download never competes with the page itself.
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => {
        if ("requestIdleCallback" in window)
          idle = window.requestIdleCallback(() => void register(), { timeout: 5000 });
        else void register();
      }, REGISTER_DELAY);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  return null;
}
