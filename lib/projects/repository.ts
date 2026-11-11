import { databaseAvailable, safeDb } from "@/lib/db";
import { upgradeStored } from "@/lib/projects/migrate";
import { normalizeTags } from "@/lib/projects/tags";
import { listItemOf, type BrandProject, type ProjectListItem } from "@/lib/projects/types";

/** Session copy, used when IndexedDB is unavailable (private mode, blocked storage). */
const memory = new Map<string, BrandProject>();

/**
 * A project as stored, made current: one saved before tags existed loads with none, and a snapshot saved by
 * an older version is migrated in memory (the stored row is rewritten by the next save). No table changes.
 */
const withTags = (project: BrandProject): BrandProject =>
  upgradeStored({ ...project, tags: normalizeTags(project.tags) });

/** How many whole projects have been read from storage in this page, so a test can see the list reads none. */
const reads = { projects: 0 };
export const projectReadCount = (): number => reads.projects;
if (typeof window !== "undefined") Object.assign(window, { __designhubProjectReads: projectReadCount });

/** A list item as stored, made current: tags are cleaned as they are for a project. */
const itemWithTags = (item: ProjectListItem): ProjectListItem => ({ ...item, tags: normalizeTags(item.tags) });

/**
 * One small row per project, for the project list: no snapshot is read. A project with no row (saved before the
 * table existed) gets one now, read once and written, and a row whose project is gone is dropped.
 */
export async function listProjectItems(): Promise<ProjectListItem[]> {
  const stored = await safeDb(async (db) => {
    const [items, ids] = await Promise.all([db.summaries.toArray(), db.projects.toCollection().primaryKeys()]);
    const present = new Set(ids);
    const have = new Set(items.map((item) => item.id));
    const kept = items.filter((item) => present.has(item.id));
    const missing = ids.filter((id) => !have.has(id));
    if (kept.length === items.length && missing.length === 0) return kept;
    const rows: ProjectListItem[] = [];
    for (const id of missing) {
      const project = await db.projects.get(id);
      reads.projects += 1;
      if (project) rows.push(listItemOf(withTags(project)));
    }
    await db.transaction("rw", db.summaries, async () => {
      await db.summaries.bulkPut(rows);
      await db.summaries.bulkDelete(items.filter((item) => !present.has(item.id)).map((item) => item.id));
    });
    return [...kept, ...rows];
  }, null);
  if (stored) return stored.map(itemWithTags);
  return [...memory.values()].map((project) => listItemOf(withTags(project)));
}

export async function listProjects(): Promise<BrandProject[]> {
  const stored = await safeDb((db) => db.projects.toArray(), null);
  if (stored) reads.projects += stored.length;
  if (stored) {
    const projects = stored.map(withTags);
    projects.forEach((project) => memory.set(project.id, project));
    return projects;
  }
  return [...memory.values()];
}

export async function getProject(id: string): Promise<BrandProject | undefined> {
  reads.projects += 1;
  const project = (await safeDb((db) => db.projects.get(id), undefined)) ?? memory.get(id);
  return project && withTags(project);
}

const savedListeners = new Set<(id: string) => void>();

/** Calls `listener` with the project id after every save (autosave, rename, import...). Returns an unsubscribe. */
export function onProjectSaved(listener: (id: string) => void): () => void {
  savedListeners.add(listener);
  return () => void savedListeners.delete(listener);
}

export async function saveProject(project: BrandProject): Promise<void> {
  memory.set(project.id, project);
  // The project and its list item are written together, so the list never shows a project it cannot find.
  await safeDb(
    (db) =>
      db.transaction("rw", db.projects, db.summaries, async () => {
        await db.projects.put(project);
        await db.summaries.put(listItemOf(project));
      }),
    undefined,
  );
  for (const listener of savedListeners) listener(project.id);
}

export async function updateProject(id: string, patch: Partial<Omit<BrandProject, "id">>): Promise<void> {
  const current = await getProject(id);
  if (!current) return;
  await saveProject({ ...current, ...patch });
}

export async function deleteProject(id: string): Promise<void> {
  memory.delete(id);
  await safeDb(
    (db) =>
      db.transaction("rw", db.projects, db.summaries, async () => {
        await db.projects.delete(id);
        await db.summaries.delete(id);
      }),
    undefined,
  );
}

export function projectsPersist(): boolean {
  return databaseAvailable();
}

export function newProjectId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
