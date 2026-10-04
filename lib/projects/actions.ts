import {
  applySnapshot,
  captureSnapshot,
  defaultSnapshot,
  snapshotStoresHydrated,
  whenSnapshotStoresHydrated,
  type BrandSnapshot,
} from "@/lib/projects/snapshot";
import {
  deleteProject,
  getProject,
  listProjects,
  newProjectId,
  saveProject,
  updateProject,
} from "@/lib/projects/repository";
import { addTag, removeTag } from "@/lib/projects/tags";
import { parseProjectsFile } from "@/lib/projects/transfer";
import { projectName, type BrandProject } from "@/lib/projects/types";
import { useBrandStore } from "@/store/brand-store";
import { useProjectStore } from "@/store/project-store";

function whenProjectStoreHydrated(): Promise<void> {
  return new Promise((resolve) => {
    if (useProjectStore.persist.hasHydrated()) resolve();
    else {
      const off = useProjectStore.persist.onFinishHydration(() => {
        off();
        resolve();
      });
    }
  });
}

export async function ready(): Promise<void> {
  await Promise.all([whenSnapshotStoresHydrated(), whenProjectStoreHydrated()]);
}

/** Writes the live stores into the active project. */
export async function saveActiveProject(): Promise<void> {
  const { activeId } = useProjectStore.getState();
  if (!activeId || !snapshotStoresHydrated() || !useProjectStore.persist.hasHydrated()) return;
  await updateProject(activeId, { snapshot: captureSnapshot(), updatedAt: Date.now() });
}

export async function createProject(
  snapshot: BrandSnapshot,
  options: { open?: boolean; tags?: string[] } = {},
): Promise<BrandProject> {
  const now = Date.now();
  const project: BrandProject = {
    id: newProjectId(),
    favorite: false,
    tags: options.tags ?? [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: options.open ? now : 0,
    snapshot: structuredClone(snapshot),
  };
  await saveProject(project);
  if (options.open) await openProject(project.id);
  return project;
}

export async function createBlankProject(name: string): Promise<BrandProject> {
  return createProject(defaultSnapshot(name), { open: true });
}

/** Saves the current project, then loads another into the live stores. */
export async function openProject(id: string): Promise<void> {
  await ready();
  const target = await getProject(id);
  if (!target) return;
  const { activeId, setActive } = useProjectStore.getState();
  if (activeId && activeId !== id) await saveActiveProject();
  // Switch first, so any pending autosave lands in the project being opened.
  setActive(id);
  if (activeId !== id) applySnapshot(target.snapshot);
  await updateProject(id, { lastOpenedAt: Date.now() });
}

/** Renames a project. The name lives in the brand profile, live or in the snapshot. */
export async function renameProject(id: string, name: string): Promise<void> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  if (useProjectStore.getState().activeId === id) {
    useBrandStore.getState().updateProfile({ name: clean });
    await saveActiveProject();
    return;
  }
  const project = await getProject(id);
  if (!project) return;
  const snapshot = structuredClone(project.snapshot);
  snapshot.brand.profile.name = clean;
  await updateProject(id, { snapshot, updatedAt: Date.now() });
}

/** Adds a tag (normalized; ignored once the project has five). */
export async function addProjectTag(id: string, tag: string): Promise<void> {
  const project = await getProject(id);
  if (project) await updateProject(id, { tags: addTag(project.tags, tag) });
}

export async function removeProjectTag(id: string, tag: string): Promise<void> {
  const project = await getProject(id);
  if (project) await updateProject(id, { tags: removeTag(project.tags, tag) });
}

export async function toggleFavorite(id: string): Promise<void> {
  const project = await getProject(id);
  if (project) await updateProject(id, { favorite: !project.favorite });
}

/** Deletes a project. Deleting the open one switches to the most recent other project. */
export async function removeProject(id: string): Promise<{ project: BrandProject; wasActive: boolean } | null> {
  // Read the latest copy first (saving live edits if it is open) so undo restores everything.
  const project = await freshProject(id);
  if (!project) return null;
  await deleteProject(id);
  const { activeId, setActive } = useProjectStore.getState();
  const wasActive = activeId === id;
  if (!wasActive) return { project, wasActive };
  const rest = (await listProjects()).sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  setActive(null);
  if (rest[0]) await openProject(rest[0].id);
  return { project, wasActive };
}

/** Puts a deleted project back with the same id, reopening it if it was the open one. */
export async function restoreProject(project: BrandProject, reopen: boolean): Promise<void> {
  await saveProject(project);
  if (reopen) await openProject(project.id);
}

let initializing: Promise<void> | null = null;

/** On first use, the brand already in the studios becomes the first project. */
export function ensureInitialProject(): Promise<void> {
  // Mounting twice at once (React strict mode, two tabs of the manager) must not create two projects.
  initializing ??= createInitialProject().finally(() => {
    initializing = null;
  });
  return initializing;
}

async function createInitialProject(): Promise<void> {
  await ready();
  const projects = await listProjects();
  const { activeId, setActive } = useProjectStore.getState();
  if (activeId && projects.some((project) => project.id === activeId)) return;
  if (projects.length === 0) {
    const project = await createProject(captureSnapshot());
    setActive(project.id);
    await updateProject(project.id, { lastOpenedAt: Date.now() });
    return;
  }
  // The active project was deleted elsewhere: adopt the live state as a new project.
  const project = await createProject(captureSnapshot());
  setActive(project.id);
}

/** Copies a project. The live state is saved first so the copy includes the latest edits. */
export async function duplicateProject(id: string): Promise<BrandProject | undefined> {
  if (useProjectStore.getState().activeId === id) await saveActiveProject();
  const source = await getProject(id);
  if (!source) return undefined;
  const snapshot = structuredClone(source.snapshot);
  snapshot.brand.profile.name = `${projectName(source)} copy`.slice(0, 60);
  return createProject(snapshot, { tags: source.tags });
}

/** Keeps names unique so an import never looks like it replaced something. */
function uniqueName(snapshot: BrandSnapshot, existing: Set<string>): void {
  let name = snapshot.brand.profile.name.trim() || "Imported brand";
  for (let n = 2; existing.has(name); n += 1) name = `${snapshot.brand.profile.name} (${n})`;
  snapshot.brand.profile.name = name;
  existing.add(name);
}

/** Adds every project in an exported file. Returns how many were imported. */
export async function importProjects(text: string): Promise<number> {
  const entries = parseProjectsFile(text);
  const existing = new Set((await listProjects()).map(projectName));
  for (const entry of entries) {
    uniqueName(entry.snapshot, existing);
    const project = await createProject(entry.snapshot, { tags: entry.tags });
    if (entry.favorite) await updateProject(project.id, { favorite: true });
  }
  return entries.length;
}

/** Adds a brand from a share link as a new project and opens it. The open project is saved, never replaced. */
export async function importSharedProject(snapshot: BrandSnapshot): Promise<BrandProject> {
  await ensureInitialProject();
  const copy = structuredClone(snapshot);
  uniqueName(copy, new Set((await listProjects()).map(projectName)));
  return createProject(copy, { open: true });
}

/** The latest copy of a project, including unsaved live edits when it is open. */
export async function freshProject(id: string): Promise<BrandProject | undefined> {
  if (useProjectStore.getState().activeId === id) await saveActiveProject();
  return getProject(id);
}
