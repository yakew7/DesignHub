import { snapshotKey } from "@/lib/projects/history";
import type { ProjectEntry } from "@/lib/projects/transfer";

/** The project already in the browser that a project of a file is, and how it was recognised. */
export type EntryMatch = { id: string; by: "id" | "copy" };

/** One project of a file as the importer takes it: added as a new project, or written over `replaceId`. */
export type ImportChoice = { entry: ProjectEntry; replaceId: string | null };

type Stored = { id: string; name: string };

/**
 * Which projects of a file are already in the browser, one answer per entry (null for a new one). A file carries the
 * id its project had where it was made, so an entry whose id is stored is that project, even if it was edited since.
 * An entry with no stored id (a file from before ids, or made in another browser) is recognised only as an identical
 * copy: the same name and the same snapshot, which `snapshotKeyOf` reads for the stored projects that share the name,
 * so no other project is read. A stored project is matched by one entry at most.
 */
export async function matchEntries(
  entries: readonly ProjectEntry[],
  stored: readonly Stored[],
  snapshotKeyOf: (id: string) => Promise<string | undefined>,
): Promise<(EntryMatch | null)[]> {
  const matches: (EntryMatch | null)[] = entries.map(() => null);
  const claimed = new Set<string>();
  const ids = new Set(stored.map((item) => item.id));
  entries.forEach((entry, index) => {
    if (!entry.id || !ids.has(entry.id) || claimed.has(entry.id)) return;
    claimed.add(entry.id);
    matches[index] = { id: entry.id, by: "id" };
  });
  for (const [index, entry] of entries.entries()) {
    if (matches[index]) continue;
    const key = snapshotKey(entry.snapshot);
    for (const item of stored) {
      if (claimed.has(item.id) || item.name !== entry.snapshot.brand.profile.name) continue;
      if ((await snapshotKeyOf(item.id)) !== key) continue;
      claimed.add(item.id);
      matches[index] = { id: item.id, by: "copy" };
      break;
    }
  }
  return matches;
}

/**
 * What the preview asks for, as choices in the order of the file. A new project is imported when it is `picked`; one
 * that is already here is written over its stored copy only when it is in `replacing`, and is skipped otherwise.
 */
export function chosenImports(
  entries: readonly ProjectEntry[],
  matches: readonly (EntryMatch | null)[],
  picked: ReadonlySet<number>,
  replacing: ReadonlySet<number>,
): ImportChoice[] {
  const choices: ImportChoice[] = [];
  entries.forEach((entry, index) => {
    const match = matches[index] ?? null;
    if (match ? replacing.has(index) : picked.has(index)) choices.push({ entry, replaceId: match?.id ?? null });
  });
  return choices;
}
