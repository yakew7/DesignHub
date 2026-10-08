"use client";

import { useMemo } from "react";

import { useColorStore } from "@/store/color-store";
import type { EffectContext } from "@/types/effects";

/** State from other studios that effects build on, read live so it is never copied into effect settings. */
export function useEffectContext(): EffectContext {
  const gradient = useColorStore((state) => state.gradient);
  return useMemo(() => ({ gradient }), [gradient]);
}
