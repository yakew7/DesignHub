import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { BrandMission, BrandProfile, BrandVoice, ColorRole } from "@/types/brand";

export const defaultVoice: BrandVoice = {
  personality: ["Clear", "Confident", "Warm"],
  dos: ["Lead with the benefit", "Use plain words", "Write like you talk"],
  donts: ["Jargon without a reason", "Exclamation marks everywhere", "Passive voice"],
  sample: "We build tools that get out of your way, so you can do the best work of your life.",
};

/** The most values the Mission & Values page lays out. */
export const MAX_BRAND_VALUES = 4;

export const defaultMission: BrandMission = {
  statement: "Give every team the tools to turn a good idea into a finished, consistent brand.",
  values: [
    { title: "Craft", description: "Details matter. We sweat the small things so nobody else has to." },
    { title: "Clarity", description: "Plain words and honest defaults beat clever tricks." },
    { title: "Openness", description: "We build in public, share what we learn and welcome help." },
    { title: "Care", description: "Every choice starts with the people who use what we make." },
  ],
};

export const defaultProfile: BrandProfile = {
  name: "Acme",
  description: "Design tools for people who ship.",
  logoSvg: null,
  roles: {},
  voice: defaultVoice,
  mission: defaultMission,
};

type BrandState = {
  profile: BrandProfile;
  updateProfile: (patch: Partial<BrandProfile>) => void;
  setRole: (swatchId: string, role: ColorRole | null) => void;
  updateVoice: (patch: Partial<BrandVoice>) => void;
  updateMission: (patch: Partial<BrandMission>) => void;
  /** Replaces the whole profile (used when switching local brand projects). */
  replaceProfile: (profile: BrandProfile) => void;
};

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      setRole: (swatchId, role) =>
        set((state) => {
          const roles = { ...state.profile.roles };
          if (role) roles[swatchId] = role;
          else delete roles[swatchId];
          return { profile: { ...state.profile, roles } };
        }),
      updateVoice: (patch) =>
        set((state) => ({ profile: { ...state.profile, voice: { ...state.profile.voice, ...patch } } })),
      updateMission: (patch) =>
        set((state) => ({ profile: { ...state.profile, mission: { ...state.profile.mission, ...patch } } })),
      replaceProfile: (profile) => set({ profile }),
    }),
    {
      name: "designhub:brand",
      version: 2,
      storage: createJSONStorage(() => indexedDbStorage),
      // v1 had no mission; the merge below fills it from the defaults.
      migrate: (persisted) => persisted as BrandState,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<BrandState>;
        const profile = { ...current.profile, ...saved.profile };
        return {
          ...current,
          ...saved,
          profile: {
            ...profile,
            voice: { ...current.profile.voice, ...saved.profile?.voice },
            mission: { ...current.profile.mission, ...saved.profile?.mission },
          },
        };
      },
    },
  ),
);
