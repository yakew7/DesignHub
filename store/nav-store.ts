import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { cleanFolded, toggleFolded } from "@/lib/nav-groups";
import { studioIds, type StudioGroup, type StudioId } from "@/lib/navigation";

function cleanLastStudio(value: unknown): StudioId | null {
  return typeof value === "string" && (studioIds as readonly string[]).includes(value) ? (value as StudioId) : null;
}

type NavState = {
  /** The sidebar groups the person folded. A first visit has none, so every group is open. */
  folded: StudioGroup[];
  toggle: (group: StudioGroup) => void;
  /** The sidebar shows only icons. A desktop choice, kept on this device. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** The last studio opened on this device, or null on a first visit. */
  lastStudio: StudioId | null;
  rememberStudio: (id: StudioId) => void;
};

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      folded: [],
      collapsed: false,
      lastStudio: null,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      toggle: (group) => set((state) => ({ folded: toggleFolded(state.folded, group) })),
      rememberStudio: (id) => set({ lastStudio: id }),
    }),
    {
      name: "designhub:nav",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ folded, collapsed, lastStudio }) => ({
        folded,
        collapsed,
        lastStudio,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<NavState> | undefined;
        return {
          ...current,
          folded: cleanFolded(saved?.folded),
          collapsed: saved?.collapsed === true,
          lastStudio: cleanLastStudio(saved?.lastStudio),
        };
      },
    },
  ),
);
