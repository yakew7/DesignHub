import { databaseAvailable, safeDb } from "@/lib/db";
import { normalizeTags } from "@/lib/projects/tags";
import type { BrandProject } from "@/lib/projects/types";

/** Session copy, used when IndexedDB is unavailable (private mode, blocked storage). */
const memory = new Map<string, BrandProject>();

/** Projects saved before tags existed have no `tags` field; they load with none. No schema change is needed. */
const withTags = (project: BrandProject): BrandProject => ({ ...project, tags: normalizeTags(project.tags) });

export async function listProjects(): Promise<BrandProject[]> {
  const stored = await safeDb((db) => db.projects.toArray(), null);
  if (stored) {
    const projects = stored.map(withTags);
    projects.forEach((project) => memory.set(project.id, project));
    return projects;
  }
  return [...memory.values()];
}

export async function getProject(id: string): Promise<BrandProject | undefined> {
  const project = (await safeDb((db) => db.projects.get(id), undefined)) ?? memory.get(id);
  return project && withTags(project);
}

export async function saveProject(project: BrandProject): Promise<void> {
  memory.set(project.id, project);
  await safeDb((db) => db.projects.put(project), undefined);
}

export async function updateProject(id: string, patch: Partial<Omit<BrandProject, "id">>): Promise<void> {
  const current = await getProject(id);
  if (!current) return;
  await saveProject({ ...current, ...patch });
}

export async function deleteProject(id: string): Promise<void> {
  memory.delete(id);
  await safeDb((db) => db.projects.delete(id), undefined);
}

export function projectsPersist(): boolean {
  return databaseAvailable();
}

export function newProjectId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
