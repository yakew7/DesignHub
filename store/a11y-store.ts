import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { A11yColors, A11yTab, A11yTypography, TouchTarget, VisionMode } from "@/types/a11y";

export const defaultSample =
  "Good accessibility is good design. Clear contrast, comfortable type and generous targets help everyone read faster, tap with confidence and stay focused on what matters.";

export const defaultTargets: TouchTarget[] = [
  { id: "t1", label: "Like", width: 32, height: 32 },
  { id: "t2", label: "Share", width: 32, height: 32 },
  { id: "t3", label: "Buy now", width: 120, height: 44 },
];

type A11yState = {
  tab: A11yTab;
  colors: A11yColors;
  /** A ring color to try instead of the brand's. null follows the brand primary live. */
  focusRing: string | null;
  typography: A11yTypography;
  sample: string;
  vision: VisionMode;
  targets: TouchTarget[];
  targetGap: number;
  /** Ephemeral: letter-scrambling reading simulation. */
  dyslexiaSimulation: boolean;
  setDyslexiaSimulation: (value: boolean) => void;
  setTab: (tab: A11yTab) => void;
  setColors: (patch: Partial<A11yColors>) => void;
  setFocusRing: (focusRing: string | null) => void;
  setTypography: (patch: Partial<A11yTypography>) => void;
  setSample: (sample: string) => void;
  setVision: (vision: VisionMode) => void;
  setTargets: (targets: TouchTarget[]) => void;
  setTargetGap: (gap: number) => void;
};

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      tab: "contrast",
      colors: { text: "#1f2937", background: "#ffffff", accent: "#4f46e5", onAccent: "#ffffff" },
      focusRing: null,
      typography: {
        family: "Inter",
        size: 16,
        lineHeight: 1.5,
        letterSpacing: 0,
        wordSpacing: 0,
        weight: 400,
        measure: 640,
      },
      sample: defaultSample,
      vision: "none",
      targets: defaultTargets,
      targetGap: 8,
      dyslexiaSimulation: false,
      setDyslexiaSimulation: (dyslexiaSimulation) => set({ dyslexiaSimulation }),
      setTab: (tab) => set({ tab }),
      setColors: (patch) => set((state) => ({ colors: { ...state.colors, ...patch } })),
      setFocusRing: (focusRing) => set({ focusRing }),
      setTypography: (patch) => set((state) => ({ typography: { ...state.typography, ...patch } })),
      setSample: (sample) => set({ sample }),
      setVision: (vision) => set({ vision }),
      setTargets: (targets) => set({ targets }),
      setTargetGap: (targetGap) => set({ targetGap }),
    }),
    {
      name: "designhub:a11y",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ colors, focusRing, typography, sample, vision, targets, targetGap }) => ({
        colors,
        focusRing,
        typography,
        sample,
        vision,
        targets,
        targetGap,
      }),
    },
  ),
);
