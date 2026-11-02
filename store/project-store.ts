import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { ProjectSort } from "@/lib/projects/sort";

/** Which local project the live stores belong to. The projects themselves live in Dexie. */
type ProjectState = {
  activeId: string | null;
  sort: ProjectSort;
  /** Whether project exports carry each project's version history. */
  exportHistory: boolean;
  /** The list filters, kept on this device. The search text is not kept. */
  favoritesOnly: boolean;
  tagFilter: string | null;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  setTagFilter: (tagFilter: string | null) => void;
  setActive: (activeId: string | null) => void;
  setSort: (sort: ProjectSort) => void;
  setExportHistory: (exportHistory: boolean) => void;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeId: null,
      sort: "opened",
      exportHistory: false,
      favoritesOnly: false,
      tagFilter: null,
      setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
      setTagFilter: (tagFilter) => set({ tagFilter }),
      setActive: (activeId) => set({ activeId }),
      setSort: (sort) => set({ sort }),
      setExportHistory: (exportHistory) => set({ exportHistory }),
    }),
    {
      name: "designhub:project",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      // Rows saved before the filters existed have none; anything that is not a yes or a short text is dropped.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ProjectState>;
        return {
          ...current,
          ...saved,
          favoritesOnly: saved.favoritesOnly === true,
          tagFilter: typeof saved.tagFilter === "string" && saved.tagFilter.length <= 40 ? saved.tagFilter : null,
        };
      },
    },
  ),
);
