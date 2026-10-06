import type { ColorRole } from "@/types/brand";

/** An image prepared for analysis: downscaled pixels plus a preview URL. */
export type DnaImage = {
  /** Unique per upload, so the same file can be added twice and removed on its own. */
  id: string;
  name: string;
  /** Object URL for the preview; revoke when done. */
  url: string;
  width: number;
  height: number;
  /** RGBA pixels of a small copy (at most 160 px on the long side). */
  pixels: Uint8ClampedArray;
  sampleWidth: number;
  sampleHeight: number;
  /** Leave this image's flat background out of the palette. Falls back to `DnaOptions`. */
  ignoreBackground?: boolean;
};

/** A moodboard combines at most this many images into one result. */
export const MAX_DNA_IMAGES = 5;

export type DnaColor = { hex: string; weight: number; role: ColorRole };

/** What a provider returns. Every field is editable before it is applied to the brand. */
export type BrandDna = {
  colors: DnaColor[];
  heading: string;
  body: string;
  personality: string[];
  mood: string;
  radius: number;
  /** 0 to 1, how sure the provider is. Shown, never used for logic. */
  confidence: number;
  notes: string[];
};

export type DnaStage = "reading" | "palette" | "mood" | "type" | "done";

export const dnaStages: { id: DnaStage; label: string }[] = [
  { id: "reading", label: "Reading image" },
  { id: "palette", label: "Extracting palette" },
  { id: "mood", label: "Reading mood" },
  { id: "type", label: "Matching typefaces" },
];

export type DnaOptions = {
  signal?: AbortSignal;
  onStage?: (stage: DnaStage) => void;
  /**
   * Leave a flat background (a logo on white) out of the palette, for images that don't
   * set their own `ignoreBackground`. Providers may ignore it.
   */
  ignoreBackground?: boolean;
};

/**
 * A source of Brand DNA. Providers run in the browser; one backed by a model would call
 * its API inside `analyze` and map the response onto `BrandDna`. Nothing else changes.
 */
export type BrandDnaProvider = {
  id: string;
  label: string;
  description: string;
  /** Runs entirely on this device, with no network. */
  local: boolean;
  /** Returns mocked data. Surfaced in the UI so it is never mistaken for real analysis. */
  mocked: boolean;
  /** Analyzes one to `MAX_DNA_IMAGES` images as one moodboard and returns one result. */
  analyze: (images: DnaImage[], options?: DnaOptions) => Promise<BrandDna>;
};
