import { safeDb } from "@/lib/db";
import {
  autoVersionDue,
  planVersion,
  sortVersions,
  type ProjectVersion,
  type VersionReason,
} from "@/lib/projects/history";
import { newProjectId } from "@/lib/projects/repository";
import { captureSnapshot, snapshotStoresHydrated, type BrandSnapshot } from "@/lib/projects/snapshot";
import { useProjectStore } from "@/store/project-store";

/** Session copy, used when IndexedDB is unavailable. */
const memory = new Map<string, ProjectVersion[]>();

/** Newest first. */
export async function listVersions(projectId: string): Promise<ProjectVersion[]> {
  const stored = await safeDb((db) => db.versions.where("projectId").equals(projectId).toArray(), null);
  return sortVersions(stored ?? memory.get(projectId) ?? []);
}

/** Saves a version unless it matches the newest one, then trims the history to the cap. */
export async function recordVersion(
  projectId: string,
  snapshot: BrandSnapshot,
  reason: VersionReason,
): Promise<ProjectVersion | null> {
  const version: ProjectVersion = {
    id: newProjectId(),
    projectId,
    createdAt: Date.now(),
    reason,
    snapshot: structuredClone(snapshot),
  };
  const plan = planVersion(await listVersions(projectId), version);
  if (!plan) return null;
  memory.set(projectId, plan.keep);
  await safeDb(
    (db) =>
      db.transaction("rw", db.versions, async () => {
        await db.versions.put(version);
        if (plan.drop.length) await db.versions.bulkDelete(plan.drop);
      }),
    undefined,
  );
  return version;
}

/** Puts versions back as they were, used when a deleted project is restored. */
export async function putVersions(projectId: string, versions: ProjectVersion[]): Promise<void> {
  memory.set(projectId, sortVersions(versions));
  await safeDb((db) => db.versions.bulkPut(versions), undefined);
}

export async function deleteVersions(projectId: string): Promise<void> {
  memory.delete(projectId);
  await safeDb((db) => db.versions.where("projectId").equals(projectId).delete(), undefined);
}

/** When each project last got a timed version, so saving while editing doesn't read the table every time. */
const lastAuto = new Map<string, number>();

/**
 * Called on every save of the open project with the snapshot it is replacing. Keeps that
 * earlier state as a version when the brand changed and the last version is a few minutes old.
 */
export async function autoVersion(projectId: string, previous: BrandSnapshot): Promise<void> {
  const now = Date.now();
  if (!autoVersionDue(lastAuto.get(projectId), now)) return;
  const newest = (await listVersions(projectId))[0];
  if (newest) lastAuto.set(projectId, Math.max(lastAuto.get(projectId) ?? 0, newest.createdAt));
  if (!autoVersionDue(newest?.createdAt, now)) return;
  lastAuto.set(projectId, now);
  await recordVersion(projectId, previous, "autosave");
}

/**
 * Keeps the open project's current state before a risky action (Surprise me, imports,
 * Brand DNA, loading a palette). Pass `snapshot` when the action already captured it.
 */
export async function checkpoint(reason: VersionReason, snapshot?: BrandSnapshot): Promise<void> {
  const { activeId } = useProjectStore.getState();
  if (!activeId || !snapshotStoresHydrated() || !useProjectStore.persist.hasHydrated()) return;
  await recordVersion(activeId, snapshot ?? captureSnapshot(), reason);
}
