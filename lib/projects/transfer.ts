import { LocalizedError } from "@/lib/i18n/errors";
import { assertKnownVersion, migrateSnapshot, readSchemaVersion, SCHEMA_VERSION } from "@/lib/projects/migrate";
import {
  MAX_VERSIONS,
  sortVersions,
  versionReasons,
  type ProjectVersion,
  type VersionReason,
} from "@/lib/projects/history";
import { defaultSnapshot, type BrandSnapshot } from "@/lib/projects/snapshot";
import { normalizeTags } from "@/lib/projects/tags";
import { projectName, type BrandProject } from "@/lib/projects/types";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { MAX_BRAND_VALUES } from "@/store/brand-store";

export const PROJECT_FORMAT = "designhub.project";
const PROJECTS_FORMAT = "designhub.projects";

/** A version as it travels in a file: ids are local to a browser, so they are left out and made fresh on import. */
export type VersionEntry = Pick<ProjectVersion, "createdAt" | "reason" | "snapshot">;

/** `history` is newest first and empty when the file has none. */
export type ProjectEntry = { favorite: boolean; tags: string[]; snapshot: BrandSnapshot; history: VersionEntry[] };

/** Project id to its versions, for exports that include history. */
export type ProjectHistories = Map<string, ProjectVersion[]>;

const historyEntries = (versions: ProjectVersion[] | undefined): VersionEntry[] | undefined =>
  versions?.length
    ? sortVersions(versions)
        .slice(0, MAX_VERSIONS)
        .map(({ createdAt, reason, snapshot }) => ({ createdAt, reason, snapshot }))
    : undefined;

/** Pass `history` to include the project's versions; without it the file holds only the current state. */
export function projectToJson(project: BrandProject, history?: ProjectVersion[]): string {
  return JSON.stringify(
    {
      format: PROJECT_FORMAT,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      name: projectName(project),
      favorite: project.favorite,
      tags: project.tags,
      snapshot: project.snapshot,
      history: historyEntries(history),
    },
    null,
    2,
  );
}

export function projectsToJson(projects: BrandProject[], histories?: ProjectHistories): string {
  return JSON.stringify(
    {
      format: PROJECTS_FORMAT,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      projects: projects.map((project) => ({
        favorite: project.favorite,
        tags: project.tags,
        snapshot: project.snapshot,
        history: historyEntries(histories?.get(project.id)),
      })),
    },
    null,
    2,
  );
}

/** The name of an archive file, with the day it was made (`designhub-archive-2026-11-21.json`). */
export const archiveFileName = (date: Date): string => `designhub-archive-${date.toISOString().slice(0, 10)}.json`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function isSwatch(value: unknown): boolean {
  if (!isObject(value) || typeof value.id !== "string" || !isObject(value.color)) return false;
  const { l, c, h } = value.color;
  return isNumber(l) && isNumber(c) && isNumber(h);
}

type Mission = BrandSnapshot["brand"]["profile"]["mission"];

/** Keeps a mission from a file only when it has the right shape; anything else falls back to the default. */
function normalizeMission(value: unknown, fallback: Mission): Mission {
  if (!isObject(value)) return fallback;
  const values = Array.isArray(value.values)
    ? value.values
        .filter(
          (item): item is { title: string; description: string } =>
            isObject(item) && typeof item.title === "string" && typeof item.description === "string",
        )
        .slice(0, MAX_BRAND_VALUES)
        .map((item) => ({ title: item.title.slice(0, 40), description: item.description.slice(0, 160) }))
    : fallback.values;
  return {
    statement: typeof value.statement === "string" ? value.statement.slice(0, 220) : fallback.statement,
    values,
  };
}

/**
 * Checks a snapshot from a file and fills anything missing from the defaults, so an
 * older or hand-edited file still opens. The logo is re-sanitized: files are untrusted.
 */
function normalizeSnapshot(input: unknown): BrandSnapshot {
  // Older snapshots are brought up to the current version first; a newer one is refused.
  const value = migrateSnapshot(input);
  if (!isObject(value)) throw new LocalizedError("error.file.noBrand");
  const base = defaultSnapshot();
  const brand = isObject(value.brand) && isObject(value.brand.profile) ? value.brand.profile : null;
  if (!brand || typeof brand.name !== "string") throw new LocalizedError("error.file.noName");
  const colors = isObject(value.colors) ? value.colors : {};
  const swatches = Array.isArray(colors.swatches) ? colors.swatches : null;
  if (!swatches || swatches.length < 2 || swatches.length > 10 || !swatches.every(isSwatch)) {
    throw new LocalizedError("error.file.palette");
  }
  const slice = <K extends keyof BrandSnapshot>(key: K): BrandSnapshot[K] =>
    (isObject(value[key]) ? { ...(base[key] as object), ...(value[key] as object) } : base[key]) as BrandSnapshot[K];

  const logo = typeof brand.logoSvg === "string" ? sanitizeSvg(brand.logoSvg) : null;
  // The social studio can hold its own logo too, which is just as untrusted.
  const socialSlice = (): BrandSnapshot["social"] => {
    const social = slice("social");
    const design = { ...base.social.design, ...(isObject(social.design) ? social.design : {}) };
    return {
      ...social,
      packSelection: normalizePackSelection(social.packSelection),
      content: { ...base.social.content, ...(isObject(social.content) ? social.content : {}) },
      design: { ...design, logoSvg: typeof design.logoSvg === "string" ? sanitizeSvg(design.logoSvg) : null },
    };
  };
  const snapshot: BrandSnapshot = {
    version: SCHEMA_VERSION,
    brand: {
      profile: {
        ...base.brand.profile,
        ...(brand as Partial<BrandSnapshot["brand"]["profile"]>),
        name: brand.name.slice(0, 60),
        logoSvg: logo,
        roles: isObject(brand.roles) ? (brand.roles as BrandSnapshot["brand"]["profile"]["roles"]) : {},
        voice: { ...base.brand.profile.voice, ...(isObject(brand.voice) ? brand.voice : {}) },
        mission: normalizeMission(brand.mission, base.brand.profile.mission),
      },
    },
    colors: { ...slice("colors"), swatches: swatches as BrandSnapshot["colors"]["swatches"] },
    typography: slice("typography"),
    tokens: slice("tokens"),
    effects: slice("effects"),
    logo: slice("logo"),
    mockups: slice("mockups"),
    social: socialSlice(),
  };
  if (typeof snapshot.typography.headingFont !== "string" || typeof snapshot.typography.bodyFont !== "string") {
    throw new LocalizedError("error.file.fonts");
  }
  return snapshot;
}

/** The social ZIP selection from a file: template ids as text, or null for the default. Ids are not looked up here. */
function normalizePackSelection(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((id): id is string => typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id)).slice(0, 300);
}

const isReason = (value: unknown): value is VersionReason =>
  typeof value === "string" && (versionReasons as readonly string[]).includes(value);

/**
 * Versions from a file, checked like the project itself (each snapshot is validated and its
 * logos re-sanitized). A version that fails the checks is dropped rather than failing the
 * import, and only the newest MAX_VERSIONS are kept, as in local history.
 */
function normalizeHistory(value: unknown): VersionEntry[] {
  if (!Array.isArray(value)) return [];
  const versions: VersionEntry[] = [];
  for (const item of value) {
    if (!isObject(item) || !isNumber(item.createdAt) || item.createdAt < 0 || !isReason(item.reason)) continue;
    try {
      versions.push({ createdAt: item.createdAt, reason: item.reason, snapshot: normalizeSnapshot(item.snapshot) });
    } catch {
      // A damaged or tampered version: skip it and keep the rest.
    }
  }
  return versions.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_VERSIONS);
}

function toEntry(value: Record<string, unknown>): ProjectEntry {
  // Files from before tags have none; tags are untrusted, so they are trimmed and capped.
  return {
    favorite: value.favorite === true,
    tags: normalizeTags(value.tags),
    snapshot: normalizeSnapshot(value.snapshot),
    history: normalizeHistory(value.history),
  };
}

/** Parses an exported project or project list. Throws a readable error for anything else. */
export function parseProjectsFile(text: string): ProjectEntry[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new LocalizedError("error.file.json");
  }
  if (!isObject(data)) throw new LocalizedError("error.file.notProject");
  if (data.format === PROJECT_FORMAT || data.format === PROJECTS_FORMAT)
    assertKnownVersion(readSchemaVersion(data.version));
  if (data.format === PROJECT_FORMAT) return [toEntry(data)];
  if (data.format === PROJECTS_FORMAT && Array.isArray(data.projects)) {
    return data.projects.map((item) => {
      if (!isObject(item)) throw new LocalizedError("error.file.damaged");
      return toEntry(item);
    });
  }
  if (data.format === "designhub.brand") {
    throw new LocalizedError("error.file.brandJson");
  }
  throw new LocalizedError("error.file.notProject");
}

/** Turns imported history into versions of the project it was imported as, with fresh ids. */
export function importedVersions(projectId: string, history: VersionEntry[], newId: () => string): ProjectVersion[] {
  return history.map((version) => ({ ...version, id: newId(), projectId }));
}
