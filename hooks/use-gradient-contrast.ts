"use client";

import { useMemo } from "react";

import { useBrandTokens } from "@/hooks/use-brand";
import { gradientTextColors, gradientTextContrast, type GradientTextResult } from "@/lib/a11y/gradient-contrast";
import { brandSurface } from "@/lib/brand/theme";
import { useColorStore } from "@/store/color-store";
import type { Gradient } from "@/types/color";

/** White, black and the brand text color checked against the brand gradient from Color Studio. */
export function useGradientContrast(): { gradient: Gradient; results: GradientTextResult[] } {
  const gradient = useColorStore((state) => state.gradient);
  const tokens = useBrandTokens();
  const brandText = brandSurface(tokens, "light").text;
  return useMemo(
    () => ({ gradient, results: gradientTextContrast(gradient, gradientTextColors(brandText)) }),
    [gradient, brandText],
  );
}
