import { projectName, type BrandProject, type ProjectListItem } from "@/lib/projects/types";

/** The words of a search, lowercased. */
const searchWords = (search: string) => search.toLowerCase().split(/\s+/).filter(Boolean);

/** What a search looks in: the project's name and its tags, lowercased. */
export const searchText = (project: BrandProject | ProjectListItem) =>
  `${projectName(project)} ${project.tags.join(" ")}`.toLowerCase();

/** True when every word of the search is in the project's name or one of its tags. Case does not matter. */
export function matchesProject(project: BrandProject | ProjectListItem, search: string): boolean {
  const words = searchWords(search);
  if (words.length === 0) return true;
  const text = searchText(project);
  return words.every((word) => text.includes(word));
}

export type ProjectFilter = { search: string; favoritesOnly: boolean; tag: string | null };

/**
 * The projects of an already sorted list that pass the filter, in the same order. `texts` holds each project's
 * `searchText`, built once per list, so a key press neither sorts again nor rebuilds a string per project.
 */
export function filterSorted<T extends ProjectListItem>(
  sorted: readonly T[],
  texts: ReadonlyMap<string, string>,
  { search, favoritesOnly, tag }: ProjectFilter,
): T[] {
  const words = searchWords(search);
  return sorted.filter((project) => {
    if (favoritesOnly && !project.favorite) return false;
    if (tag && !project.tags.includes(tag)) return false;
    if (words.length === 0) return true;
    const text = texts.get(project.id) ?? searchText(project);
    return words.every((word) => text.includes(word));
  });
}

/** How many project cards are drawn first, and how many more each step adds. */
export const PROJECT_PAGE = 30;
