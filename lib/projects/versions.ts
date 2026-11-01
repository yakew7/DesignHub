import { safeDb } from "@/lib/db";
import { upgradeStored } from "@/lib/projects/migrate";
import {
  autoVersionDue,
  planVersion,
  sortVersions,
  type ProjectVersion,
  type VersionReason,
} from "@/lib/projects/history";
import { sameJson, type Json } from "@/lib/projects/delta";
import { compactVersions, expandVersions } from "@/lib/projects/version-storage";
import { newProjectId } from "@/lib/projects/repository";
import { captureSnapshot, snapshotStoresHydrated, type BrandSnapshot } from "@/lib/projects/snapshot";
import { useProjectStore } from "@/store/project-store";

/** Session copy, used when IndexedDB is unavailable. */
const memory = new Map<string, ProjectVersion[]>();

/** Newest first. */
export async function listVersions(projectId: string): Promise<ProjectVersion[]> {
  const stored = await safeDb((db) => db.versions.where("projectId").equals(projectId).toArray(), null);
  if (stored) return expandVersions(stored, upgradeStored);
  return sortVersions((memory.get(projectId) ?? []).map(upgradeStored));
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
  // The new version is whole and the one before it becomes a change from it; only rows whose form changed are
  // written, so a save writes about two rows however long the history is.
  const rows = compactVersions(plan.keep);
  await safeDb(
    (db) =>
      db.transaction("rw", db.versions, async () => {
        const stored = await db.versions.where("projectId").equals(projectId).toArray();
        const before = new Map(stored.map((row) => [row.id, row as unknown as Json]));
        const changed = rows.filter((row) => !sameJson(before.get(row.id) ?? null, row as unknown as Json));
        if (changed.length) await db.versions.bulkPut(changed);
        if (plan.drop.length) await db.versions.bulkDelete(plan.drop);
      }),
    undefined,
  );
  return version;
}

/** Puts versions back as they were, used when a deleted project is restored. */
export async function putVersions(projectId: string, versions: ProjectVersion[]): Promise<void> {
  memory.set(projectId, sortVersions(versions));
  await safeDb((db) => db.versions.bulkPut(compactVersions(versions)), undefined);
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

/** Every version of every project, whole again, for the Storage panel. */
export async function listAllVersions(): Promise<ProjectVersion[]> {
  const stored = await safeDb((db) => db.versions.toArray(), null);
  if (!stored) return [...memory.values()].flat().map(upgradeStored);
  const byProject = new Map<string, typeof stored>();
  for (const row of stored) byProject.set(row.projectId, [...(byProject.get(row.projectId) ?? []), row]);
  return [...byProject.values()].flatMap((rows) => expandVersions(rows, upgradeStored));
}

/**
 * Deletes versions. Only the oldest part of a history may go this way (see `versionsToTrim`): the versions after it
 * are changes from the ones newer than them, so they stay whole.
 */
export async function removeVersions(versions: ProjectVersion[]): Promise<void> {
  const ids = new Set(versions.map((version) => version.id));
  for (const [projectId, list] of memory)
    memory.set(
      projectId,
      list.filter((version) => !ids.has(version.id)),
    );
  await safeDb((db) => db.versions.bulkDelete([...ids]), undefined);
}

/** Puts versions back after `removeVersions`, grouped by project. */
export async function restoreVersions(versions: ProjectVersion[]): Promise<void> {
  const byProject = new Map<string, ProjectVersion[]>();
  for (const version of versions)
    byProject.set(version.projectId, [...(byProject.get(version.projectId) ?? []), version]);
  for (const [projectId, list] of byProject) {
    const kept = await listVersions(projectId);
    const merged = sortVersions([...kept, ...list]);
    // Re-compact the whole history: the restored ones are older than every kept one.
    memory.set(projectId, merged);
    await safeDb((db) => db.versions.bulkPut(compactVersions(merged)), undefined);
  }
}
