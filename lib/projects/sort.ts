import { projectName, type BrandProject, type ProjectListItem } from "@/lib/projects/types";

/** A project or a list item: what the order depends on. */
type Sortable = BrandProject | ProjectListItem;

export type ProjectSort = "opened" | "edited" | "name" | "newest" | "size";

/** In menu order. Labels are the `projects.sort.<value>` messages. */
export const projectSorts: readonly ProjectSort[] = ["opened", "edited", "name", "newest", "size"];

/** A project's stored size, or -1 when its row has none yet, so unmeasured projects sort last by size. */
const sizeOf = (item: Sortable): number => ("sizeBytes" in item ? (item.sizeBytes ?? -1) : -1);

const compare: Record<ProjectSort, (a: Sortable, b: Sortable) => number> = {
  opened: (a, b) => b.lastOpenedAt - a.lastOpenedAt || b.updatedAt - a.updatedAt,
  edited: (a, b) => b.updatedAt - a.updatedAt,
  name: (a, b) => projectName(a).localeCompare(projectName(b), undefined, { sensitivity: "base", numeric: true }),
  newest: (a, b) => b.createdAt - a.createdAt,
  size: (a, b) => sizeOf(b) - sizeOf(a),
};

/** Favorites always come first; the chosen order applies within each group. */
export function sortProjects<T extends Sortable>(projects: T[], sort: ProjectSort): T[] {
  return [...projects].sort((a, b) => Number(b.favorite) - Number(a.favorite) || compare[sort](a, b));
}
