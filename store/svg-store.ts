import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { defaultOptimizeOptions, type SvgOptimizeOptions } from "@/lib/svg/optimize";
import { sampleSvg } from "@/lib/svg/sample";
import { symbolId, uniqueSymbolId, type SpriteItem } from "@/lib/svg/sprite";
import type { NodePath } from "@/lib/svg/tree";

type SvgState = {
  name: string;
  source: string;
  setDocument: (name: string, source: string) => void;
  setSource: (source: string) => void;
  loadSample: () => void;
  selected: NodePath | null;
  select: (path: NodePath | null) => void;
  sprite: SpriteItem[];
  addToSprite: (name: string, source: string) => void;
  renameSprite: (index: number, id: string) => void;
  removeFromSprite: (index: number) => void;
  clearSprite: () => void;
  currentColor: boolean;
  setCurrentColor: (value: boolean) => void;
  options: SvgOptimizeOptions;
  setOptions: (patch: Partial<SvgOptimizeOptions>) => void;
};

export const useSvgStore = create<SvgState>()(
  persist(
    (set) => ({
      name: "badge.svg",
      source: sampleSvg,
      setDocument: (name, source) => set({ name, source, selected: null }),
      selected: null,
      select: (selected) => set({ selected }),
      setSource: (source) => set({ source }),
      loadSample: () => set({ name: "badge.svg", source: sampleSvg, selected: null }),
      sprite: [],
      addToSprite: (name, source) =>
        set((state) => {
          const id = uniqueSymbolId(
            name,
            state.sprite.map((item) => item.id),
          );
          return { sprite: [...state.sprite, { id, source }] };
        }),
      renameSprite: (index, id) =>
        set((state) => ({
          sprite: state.sprite.map((item, i) => (i === index ? { ...item, id: symbolId(id) } : item)),
        })),
      removeFromSprite: (index) => set((state) => ({ sprite: state.sprite.filter((_, i) => i !== index) })),
      clearSprite: () => set({ sprite: [] }),
      currentColor: false,
      setCurrentColor: (currentColor) => set({ currentColor }),
      options: defaultOptimizeOptions,
      setOptions: (patch) => set((state) => ({ options: { ...state.options, ...patch } })),
    }),
    {
      name: "designhub:svg",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ name, source, options, currentColor, sprite }) => ({
        name,
        source,
        options,
        currentColor,
        sprite,
      }),
    },
  ),
);
