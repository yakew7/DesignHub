import { hashString } from "@/lib/brand/logo";
import type { BrandDna, BrandDnaProvider, DnaOptions } from "@/lib/brand-dna/types";

const samples: BrandDna[] = [
  {
    colors: [
      { hex: "#0F766E", weight: 0.42, role: "primary" },
      { hex: "#F59E0B", weight: 0.18, role: "secondary" },
      { hex: "#F8FAFC", weight: 0.3, role: "neutral" },
      { hex: "#0F172A", weight: 0.1, role: "neutral" },
    ],
    heading: "DM Serif Display",
    body: "DM Sans",
    personality: ["Grounded", "Optimistic", "Expert"],
    mood: "Natural",
    radius: 10,
    confidence: 0.82,
    notes: ["Sample response. Connect a model in lib/brand-dna/providers to analyze real images."],
  },
  {
    colors: [
      { hex: "#7C3AED", weight: 0.36, role: "primary" },
      { hex: "#EC4899", weight: 0.22, role: "secondary" },
      { hex: "#FAFAF9", weight: 0.32, role: "neutral" },
      { hex: "#18181B", weight: 0.1, role: "neutral" },
    ],
    heading: "Sora",
    body: "Inter",
    personality: ["Imaginative", "Bold", "Friendly"],
    mood: "Expressive",
    radius: 18,
    confidence: 0.77,
    notes: ["Sample response. Connect a model in lib/brand-dna/providers to analyze real images."],
  },
];

/**
 * Stand-in for a vision model, for building the UI without a paid API. It waits like a
 * network call and returns sample data chosen from the file names.
 */
export const mockAiProvider: BrandDnaProvider = {
  id: "mock-ai",
  label: "AI (mock)",
  description: "Simulates a vision model with sample data. Use it to develop against the provider interface.",
  local: true,
  mocked: true,
  async analyze(images, options: DnaOptions = {}) {
    const { signal, onStage } = options;
    for (const stage of ["reading", "palette", "mood", "type"] as const) {
      onStage?.(stage);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 450);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }
    onStage?.("done");
    const key = images.map((image) => image.name).join("\n");
    return structuredClone(samples[hashString(key) % samples.length]!);
  },
};
