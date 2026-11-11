import { toHex } from "@/lib/color/color";
import type { BrandSnapshot } from "@/lib/projects/snapshot";

/** The project's name is its brand name (snapshot.brand.profile.name), so it is never stored twice. */
export type BrandProject = {
  id: string;
  favorite: boolean;
  /** Up to five short labels such as "client" or "archived". Records saved before tags have none. */
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  snapshot: BrandSnapshot;
};

/**
 * What the project list needs of a project, stored beside it so the list opens without reading any snapshot: the
 * name, up to six colors for a placeholder strip, and the fields the list sorts, filters and searches on.
 */
export type ProjectListItem = Omit<BrandProject, "snapshot"> & { name: string; colors: string[] };

/** How many colors a list item keeps. */
export const LIST_COLORS = 6;

/** The list item of a project, written whenever the project is saved. */
export function listItemOf(project: BrandProject): ProjectListItem {
  const { snapshot, ...rest } = project;
  return {
    ...rest,
    name: snapshot.brand.profile.name,
    colors: snapshot.colors.swatches.slice(0, LIST_COLORS).map((swatch) => toHex(swatch.color)),
  };
}

/** A project, or its list item: either has a name to show. */
type Named = { snapshot: BrandProject["snapshot"] } | { name: string };

export const projectName = (project: Named) =>
  ("name" in project ? project.name : project.snapshot.brand.profile.name).trim() || "Untitled brand";
