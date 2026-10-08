import { projectName, type BrandProject } from "@/lib/projects/types";

export type ProjectSort = "opened" | "edited" | "name" | "newest";

/** In menu order. Labels are the `projects.sort.<value>` messages. */
export const projectSorts: readonly ProjectSort[] = ["opened", "edited", "name", "newest"];

const compare: Record<ProjectSort, (a: BrandProject, b: BrandProject) => number> = {
  opened: (a, b) => b.lastOpenedAt - a.lastOpenedAt || b.updatedAt - a.updatedAt,
  edited: (a, b) => b.updatedAt - a.updatedAt,
  name: (a, b) => projectName(a).localeCompare(projectName(b), undefined, { sensitivity: "base", numeric: true }),
  newest: (a, b) => b.createdAt - a.createdAt,
};

/** Favorites always come first; the chosen order applies within each group. */
export function sortProjects(projects: BrandProject[], sort: ProjectSort): BrandProject[] {
  return [...projects].sort((a, b) => Number(b.favorite) - Number(a.favorite) || compare[sort](a, b));
}
