import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { SocialContent, SocialDesign } from "@/lib/social/types";
import type { BrandMode } from "@/types/brand";

/** Empty fields fall back to values derived from the brand (see useSocialContext). */
export const defaultSocialContent: SocialContent = {
  name: "",
  headline: "",
  subtitle: "Open source. Local first. Free forever.",
  handle: "",
  github: "",
  website: "",
  cta: "Try it free",
};

export const defaultSocialDesign: SocialDesign = {
  primary: null,
  secondary: null,
  background: "auto",
  radius: null,
  padding: 80,
  logoSvg: null,
};

type SocialState = {
  template: string;
  mode: BrandMode;
  content: SocialContent;
  design: SocialDesign;
  safeArea: boolean;
  /** Add "Banner made with DesignHub" under the README snippet. */
  credit: boolean;
  setTemplate: (template: string) => void;
  setMode: (mode: BrandMode) => void;
  setContent: (patch: Partial<SocialContent>) => void;
  setDesign: (patch: Partial<SocialDesign>) => void;
  resetDesign: () => void;
  setSafeArea: (safeArea: boolean) => void;
  setCredit: (credit: boolean) => void;
};

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      template: "github-minimal",
      mode: "dark",
      content: defaultSocialContent,
      design: defaultSocialDesign,
      safeArea: false,
      credit: true,
      setTemplate: (template) => set({ template }),
      setMode: (mode) => set({ mode }),
      setContent: (patch) => set((state) => ({ content: { ...state.content, ...patch } })),
      setDesign: (patch) => set((state) => ({ design: { ...state.design, ...patch } })),
      resetDesign: () => set({ design: defaultSocialDesign }),
      setSafeArea: (safeArea) => set({ safeArea }),
      setCredit: (credit) => set({ credit }),
    }),
    {
      name: "designhub:social",
      version: 2,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ template, mode, content, design, safeArea, credit }) => ({
        template,
        mode,
        content,
        design,
        safeArea,
        credit,
      }),
      // v1 had no design settings and fewer content fields; fill them from the defaults.
      migrate: (persisted) => persisted as SocialState,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SocialState>;
        return {
          ...current,
          ...saved,
          content: { ...current.content, ...saved.content },
          design: { ...current.design, ...saved.design },
        };
      },
    },
  ),
);
