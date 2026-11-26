export function isEnglishText(text: string): boolean;
export function hardcodedIn(file: string, source: string): { line: number; text: string; kind: string }[];
export function ratchet(
  counts: Record<string, number>,
  baseline: Record<string, number>,
): { folder: string; now: number; was: number; kind: "up" | "down" }[];
