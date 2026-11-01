import type { ProjectVersion } from "@/lib/projects/history";

const DAY = 24 * 60 * 60 * 1000;

/** The cut-offs the Storage panel offers, in days. */
export const trimDays = [30, 90, 365] as const;

/**
 * The versions a cut-off would remove: those older than `days`, except the newest version of each project, which is
 * always kept. Older versions are always the oldest ones, so what is left is still a whole chain.
 */
export function versionsToTrim(versions: readonly ProjectVersion[], days: number, now = Date.now()): ProjectVersion[] {
  const cutoff = now - days * DAY;
  const newest = new Map<string, ProjectVersion>();
  for (const version of versions) {
    const current = newest.get(version.projectId);
    if (!current || version.createdAt > current.createdAt) newest.set(version.projectId, version);
  }
  return versions.filter((version) => version.createdAt < cutoff && newest.get(version.projectId)?.id !== version.id);
}

/** Projects by the size of what they keep, largest first, with the history counted apart from the current state. */
export function sizesByProject(
  projects: readonly { id: string; name: string; bytes: number }[],
  versions: readonly { projectId: string; bytes: number }[],
): { id: string; name: string; project: number; history: number; versions: number }[] {
  return projects
    .map((project) => {
      const own = versions.filter((version) => version.projectId === project.id);
      return {
        id: project.id,
        name: project.name,
        project: project.bytes,
        history: own.reduce((sum, version) => sum + version.bytes, 0),
        versions: own.length,
      };
    })
    .sort((a, b) => b.project + b.history - (a.project + a.history));
}
