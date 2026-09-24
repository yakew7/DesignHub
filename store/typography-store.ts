import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { defaultFontFilters, type FontFilters } from "@/lib/typography/filter";
import { defaultCompareFont } from "@/lib/typography/compare";
import { toggleFeature as applyFeatureToggle } from "@/lib/typography/opentype-features";

import type { OpenTypeSettings, SpecimenSettings, TextRhythm, TypeScaleSettings } from "@/types/typography";

export const DEFAULT_SPECIMEN_TEXT = "The quick brown fox jumps over the lazy dog";

export const defaultSpecimen: SpecimenSettings = {
  text: DEFAULT_SPECIMEN_TEXT,
  size: 56,
  weight: 500,
  italic: false,
  letterSpacing: -0.02,
  lineHeight: 1.15,
  axes: {},
};

export const defaultScale: TypeScaleSettings = {
  baseSize: 18,
  ratio: 1.25,
  minBase: 16,
  minRatio: 1.2,
  minViewport: 360,
  maxViewport: 1280,
  stepsUp: 5,
  stepsDown: 2,
};

export const defaultOpenType: OpenTypeSettings = {
  liga: true,
  dlig: false,
  kern: true,
  smcp: false,
  c2sc: false,
  lnum: false,
  onum: false,
  tnum: false,
  pnum: false,
  zero: false,
  frac: false,
  ss01: false,
  ss02: false,
  case: false,
};

export const defaultRhythm: TextRhythm = {
  headingWeight: 600,
  bodyWeight: 400,
  headingLineHeight: 1.1,
  bodyLineHeight: 1.6,
  headingTracking: -0.02,
  bodyTracking: 0,
};

export type TypographyTab = "browse" | "pair" | "scale" | "export";

type TypographyState = {
  tab: TypographyTab;
  /** Font currently open in the specimen / playground. */
  activeFont: string;
  /** Second font pinned next to the active one. Null means compare is off. */
  compareFont: string | null;
  headingFont: string;
  bodyFont: string;
  specimen: SpecimenSettings;
  scale: TypeScaleSettings;
  openType: OpenTypeSettings;
  filters: FontFilters;
  rhythm: TextRhythm;
  updateRhythm: (patch: Partial<TextRhythm>) => void;
  setTab: (tab: TypographyTab) => void;
  setActiveFont: (family: string) => void;
  setCompareFont: (family: string | null) => void;
  startCompare: () => void;
  swapCompare: () => void;
  setPair: (pair: { heading?: string; body?: string }) => void;
  updateSpecimen: (patch: Partial<SpecimenSettings>) => void;
  setAxis: (tag: string, value: number) => void;
  updateScale: (patch: Partial<TypeScaleSettings>) => void;
  toggleFeature: (tag: keyof OpenTypeSettings) => void;
  resetSpecimen: () => void;
  setFilters: (patch: Partial<FontFilters>) => void;
  resetFilters: () => void;
};

export const useTypographyStore = create<TypographyState>()(
  persist(
    (set) => ({
      tab: "browse",
      activeFont: "Inter",
      compareFont: null,
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      specimen: defaultSpecimen,
      scale: defaultScale,
      openType: defaultOpenType,
      setTab: (tab) => set({ tab }),
      setActiveFont: (family) => set((state) => ({ activeFont: family, specimen: { ...state.specimen, axes: {} } })),
      setCompareFont: (compareFont) => set({ compareFont }),
      startCompare: () =>
        set((state) => ({
          compareFont: state.compareFont ?? defaultCompareFont(state.activeFont, [state.headingFont, state.bodyFont]),
        })),
      swapCompare: () =>
        set((state) =>
          state.compareFont
            ? {
                activeFont: state.compareFont,
                compareFont: state.activeFont,
                specimen: { ...state.specimen, axes: {} },
              }
            : state,
        ),
      setPair: ({ heading, body }) =>
        set((state) => ({ headingFont: heading ?? state.headingFont, bodyFont: body ?? state.bodyFont })),
      updateSpecimen: (patch) => set((state) => ({ specimen: { ...state.specimen, ...patch } })),
      setAxis: (tag, value) =>
        set((state) => ({ specimen: { ...state.specimen, axes: { ...state.specimen.axes, [tag]: value } } })),
      updateScale: (patch) => set((state) => ({ scale: { ...state.scale, ...patch } })),
      toggleFeature: (tag) => set((state) => ({ openType: applyFeatureToggle(state.openType, tag) })),
      resetSpecimen: () => set({ specimen: defaultSpecimen, openType: defaultOpenType }),
      rhythm: defaultRhythm,
      updateRhythm: (patch) => set((state) => ({ rhythm: { ...state.rhythm, ...patch } })),
      filters: defaultFontFilters,
      setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
      resetFilters: () => set({ filters: defaultFontFilters }),
    }),
    {
      name: "designhub:typography",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      // UI-only state (tab, search) is not worth restoring.
      partialize: ({ activeFont, compareFont, headingFont, bodyFont, specimen, scale, openType, rhythm }) => ({
        rhythm,
        activeFont,
        compareFont,
        headingFont,
        bodyFont,
        specimen,
        scale,
        openType,
      }),
    },
  ),
);
