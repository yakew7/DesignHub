import { projectName, type BrandProject, type ProjectListItem } from "@/lib/projects/types";

/** True when every word of the search is in the project's name or one of its tags. Case does not matter. */
export function matchesProject(project: BrandProject | ProjectListItem, search: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = `${projectName(project)} ${project.tags.join(" ")}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

/** How many project cards are drawn first, and how many more each step adds. */
export const PROJECT_PAGE = 30;
