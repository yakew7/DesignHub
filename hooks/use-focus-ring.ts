"use client";

import { useMemo } from "react";

import { useBrandTokens } from "@/hooks/use-brand";
import { brandSurface } from "@/lib/brand/theme";
import { useA11yStore } from "@/store/a11y-store";

/**
 * The focus ring the Accessibility Lab checks. The brand has no separate ring role, so the ring
 * is the primary color, read live from the color store, unless the lab is trying a fix.
 */
export function useFocusRing(): { ring: string; brandRing: string; fromBrand: boolean } {
  const tokens = useBrandTokens();
  const override = useA11yStore((state) => state.focusRing);
  return useMemo(() => {
    const brandRing = brandSurface(tokens, "light").primary;
    return { ring: override ?? brandRing, brandRing, fromBrand: override === null };
  }, [tokens, override]);
}
