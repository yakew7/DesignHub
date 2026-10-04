import type { BrandProject } from "@/lib/projects/types";

export const MAX_PROJECT_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

/** Lowercase, single-spaced and short, so "Client " and "client" are the same tag. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_TAG_LENGTH).trim();
}

/**
 * Tags from anywhere untrusted (a file, an older record): strings only, trimmed,
 * without blanks or duplicates, at most five. Anything else becomes no tags.
 */
export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const tag = normalizeTag(item);
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length === MAX_PROJECT_TAGS) break;
  }
  return tags;
}

/** Adds a tag unless it is blank, already there, or the project is full. */
export function addTag(tags: string[], raw: string): string[] {
  return normalizeTags([...tags, raw]);
}

export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((item) => item !== tag);
}

/** Every tag in use, A to Z, for the filter. */
export function projectTags(projects: BrandProject[]): string[] {
  return [...new Set(projects.flatMap((project) => project.tags))].sort((a, b) => a.localeCompare(b));
}
