import { studios } from "@/lib/navigation";

/** How many of the studios used last are kept for offline use on their own. */
export const KEEP_RECENT = 4;

/**
 * The addresses of the studios a person used last, newest first: the last studio, then the studios chosen in the
 * command palette. Only studios that were used are listed, so one never used is never downloaded.
 */
export function recentStudioHrefs(lastStudio: string | null, recent: readonly string[], limit = KEEP_RECENT): string[] {
  const ids = [lastStudio, ...recent.filter((id) => id.startsWith("studio:")).map((id) => id.slice(7))];
  const hrefs: string[] = [];
  for (const id of ids) {
    const studio = studios.find((item) => item.id === id);
    if (studio && !hrefs.includes(studio.href) && studio.href !== "/") hrefs.push(studio.href);
  }
  return hrefs.slice(0, limit);
}
