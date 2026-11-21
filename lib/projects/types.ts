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
 * name, the size of the stored snapshot in bytes, and the fields the list sorts, filters and searches on. No
 * colors: a card shows a plain box until its picture is drawn (#547). Rows written before that still carry a
 * `colors` field, which nothing reads. Rows written before the size existed have no `sizeBytes` until the list
 * measures them once (#600).
 */
export type ProjectListItem = Omit<BrandProject, "snapshot"> & { name: string; sizeBytes?: number };

/** The bytes the stored snapshot takes as JSON: the project's size, without its version history. */
export function snapshotBytes(snapshot: BrandSnapshot): number {
  return new TextEncoder().encode(JSON.stringify(snapshot)).length;
}

/** The list item of a project, written whenever the project is saved. */
export function listItemOf(project: BrandProject): ProjectListItem {
  const { snapshot, ...rest } = project;
  return { ...rest, name: snapshot.brand.profile.name, sizeBytes: snapshotBytes(snapshot) };
}

/** A project, or its list item: either has a name to show. */
type Named = { snapshot: BrandProject["snapshot"] } | { name: string };

export const projectName = (project: Named) =>
  ("name" in project ? project.name : project.snapshot.brand.profile.name).trim() || "Untitled brand";
