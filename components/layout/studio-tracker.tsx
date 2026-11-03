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
    if (studio) {
      rememberStudio(studio.id);
    }
  }, [pathname, rememberStudio]);

  return null;
}
