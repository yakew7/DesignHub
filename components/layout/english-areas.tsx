"use client";

import { Suspense, use, type ReactNode } from "react";

import { loadEnglishAreas, type EnglishArea } from "@/lib/i18n/areas";

function Loaded({ areas, children }: { areas: readonly EnglishArea[]; children: ReactNode }) {
  use(loadEnglishAreas(areas));
  return children;
}

/**
 * Loads the English messages of a studio's areas before it draws. While they load the server's HTML stays on screen
 * (React keeps a boundary that suspends during hydration as it was sent), so nothing flashes.
 */
export function EnglishAreas({ areas, children }: { areas: readonly EnglishArea[]; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Loaded areas={areas}>{children}</Loaded>
    </Suspense>
  );
}
