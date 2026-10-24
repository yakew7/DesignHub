import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { setPagesIncluded } from "@/lib/guidelines/sections";
import type { CoverStyle } from "@/lib/guidelines/types";
import type { BrandMode } from "@/types/brand";

/** View and selection state only. Every value on the pages comes from the brand. */
type GuidelinesState = {
  selected: string;
  excluded: string[];
  mode: BrandMode;
  coverStyle: CoverStyle;
  select: (id: string) => void;
  toggle: (id: string) => void;
  /** Switches several pages on or off at once (a whole section). */
  setIncluded: (ids: string[], included: boolean) => void;
  setMode: (mode: BrandMode) => void;
  setCoverStyle: (coverStyle: CoverStyle) => void;
};

export const useGuidelinesStore = create<GuidelinesState>()(
  persist(
    (set) => ({
      selected: "cover",
      excluded: [],
      mode: "light",
      coverStyle: "gradient",
      select: (selected) => set({ selected }),
      toggle: (id) =>
        set((state) => ({
          excluded: state.excluded.includes(id)
            ? state.excluded.filter((item) => item !== id)
            : [...state.excluded, id],
        })),
      setIncluded: (ids, included) => set((state) => ({ excluded: setPagesIncluded(state.excluded, ids, included) })),
      setMode: (mode) => set({ mode }),
      setCoverStyle: (coverStyle) => set({ coverStyle }),
    }),
    { name: "designhub:guidelines", version: 1, storage: createJSONStorage(() => indexedDbStorage) },
  ),
);
