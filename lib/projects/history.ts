import type { BrandSnapshot } from "@/lib/projects/snapshot";

/** Why a version was kept: a timed save while editing, or the state just before a risky action. */
export type VersionReason =
  "autosave" | "surprise" | "token-import" | "brand-dna" | "share-import" | "palette" | "restore";

/** One saved state of a project, stored in the `versions` table. */
export type ProjectVersion = {
  id: string;
  projectId: string;
  createdAt: number;
  reason: VersionReason;
  snapshot: BrandSnapshot;
};

/** Versions kept per project; the oldest are dropped first. */
export const MAX_VERSIONS = 20;

/** While editing, at most one timed version per this many milliseconds. */
export const AUTO_VERSION_INTERVAL = 5 * 60_000;

export const versionReasonLabels: Record<VersionReason, string> = {
  autosave: "While editing",
  surprise: "Before Surprise me",
  "token-import": "Before token import",
  "brand-dna": "Before Brand DNA",
  "share-import": "Before share link import",
  palette: "Before loading a palette",
  restore: "Before restoring a version",
};

/** JSON with sorted keys, so two snapshots with the same values match whatever order they were built in. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : item,
  );
}

export function sameSnapshot(a: BrandSnapshot, b: BrandSnapshot): boolean {
  return stable(a) === stable(b);
}

/** Newest first. */
export function sortVersions(versions: ProjectVersion[]): ProjectVersion[] {
  return [...versions].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Adds a version to a project's history. Returns null when the newest version already holds the
 * same snapshot (nothing to save); otherwise the ids to drop so at most `max` versions remain.
 */
export function planVersion(
  existing: ProjectVersion[],
  next: ProjectVersion,
  max = MAX_VERSIONS,
): { keep: ProjectVersion[]; drop: string[] } | null {
  const sorted = sortVersions(existing.filter((version) => version.projectId === next.projectId));
  const newest = sorted[0];
  if (newest && sameSnapshot(newest.snapshot, next.snapshot)) return null;
  const all = [next, ...sorted];
  return { keep: all.slice(0, max), drop: all.slice(max).map((version) => version.id) };
}

/** True when enough time has passed since the newest version for a timed one. */
export function autoVersionDue(newestAt: number | undefined, now: number, interval = AUTO_VERSION_INTERVAL): boolean {
  return newestAt === undefined || now - newestAt >= interval;
}
