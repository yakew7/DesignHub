import { studioGroups, studioOfPath, type StudioGroup } from "@/lib/navigation";

/** The group of the studio that `pathname` is in, or null on the home page and other routes. */
export function groupOfPath(pathname: string): StudioGroup | null {
  return studioOfPath(pathname)?.group ?? null;
}

/** A group is open unless it was folded, and the group that holds the current page is always open. */
export function isGroupOpen(group: StudioGroup, folded: readonly StudioGroup[], pathname: string): boolean {
  return !folded.includes(group) || groupOfPath(pathname) === group;
}

/** Saved folded groups with anything that is not a group today dropped, and no repeats. */
export function cleanFolded(value: unknown): StudioGroup[] {
  if (!Array.isArray(value)) return [];
  return studioGroups.filter((group) => value.includes(group));
}

export function toggleFolded(folded: readonly StudioGroup[], group: StudioGroup): StudioGroup[] {
  return folded.includes(group) ? folded.filter((item) => item !== group) : [...folded, group];
}
