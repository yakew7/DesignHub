"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { studioOfPath } from "@/lib/navigation";
import { useNavStore } from "@/store/nav-store";

/** Remembers the last studio opened on this device, outside any project. */
export function StudioTracker() {
  const pathname = usePathname();
  const rememberStudio = useNavStore((state) => state.rememberStudio);

  useEffect(() => {
    const studio = studioOfPath(pathname);
    if (!studio) return;
    // The saved state replaces the store's own when it has loaded, so a studio remembered before that would be
    // overwritten by the one saved last time. Remember it once the saved state is in.
    if (useNavStore.persist.hasHydrated()) {
      rememberStudio(studio.id);
      return;
    }
    return useNavStore.persist.onFinishHydration(() => rememberStudio(studio.id));
  }, [pathname, rememberStudio]);

  return null;
}
