import { defaultSnapshot, type BrandSnapshot } from "@/lib/projects/snapshot";
import { projectName, type BrandProject } from "@/lib/projects/types";
import { sanitizeSvg } from "@/lib/svg/sanitize";

export const PROJECT_FORMAT = "designhub.project";
export const PROJECTS_FORMAT = "designhub.projects";

type ProjectEntry = { favorite: boolean; snapshot: BrandSnapshot };

export function projectToJson(project: BrandProject): string {
  return JSON.stringify(
    {
      format: PROJECT_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      name: projectName(project),
      favorite: project.favorite,
      snapshot: project.snapshot,
    },
    null,
    2,
  );
}

export function projectsToJson(projects: BrandProject[]): string {
  return JSON.stringify(
    {
      format: PROJECTS_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: projects.map((project) => ({ favorite: project.favorite, snapshot: project.snapshot })),
    },
    null,
    2,
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function isSwatch(value: unknown): boolean {
  if (!isObject(value) || typeof value.id !== "string" || !isObject(value.color)) return false;
  const { l, c, h } = value.color;
  return isNumber(l) && isNumber(c) && isNumber(h);
}

/**
 * Checks a snapshot from a file and fills anything missing from the defaults, so an
 * older or hand-edited file still opens. The logo is re-sanitized: files are untrusted.
 */
function normalizeSnapshot(value: unknown): BrandSnapshot {
  if (!isObject(value)) throw new Error("The file has no brand data.");
  const base = defaultSnapshot();
  const brand = isObject(value.brand) && isObject(value.brand.profile) ? value.brand.profile : null;
  if (!brand || typeof brand.name !== "string") throw new Error("The brand name is missing.");
  const colors = isObject(value.colors) ? value.colors : {};
  const swatches = Array.isArray(colors.swatches) ? colors.swatches : null;
  if (!swatches || swatches.length < 2 || swatches.length > 10 || !swatches.every(isSwatch)) {
    throw new Error("The palette in this file isn't valid.");
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
      content: { ...base.social.content, ...(isObject(social.content) ? social.content : {}) },
      design: { ...design, logoSvg: typeof design.logoSvg === "string" ? sanitizeSvg(design.logoSvg) : null },
    };
  };
  const snapshot: BrandSnapshot = {
    version: 1,
    brand: {
      profile: {
        ...base.brand.profile,
        ...(brand as Partial<BrandSnapshot["brand"]["profile"]>),
        name: brand.name.slice(0, 60),
        logoSvg: logo,
        roles: isObject(brand.roles) ? (brand.roles as BrandSnapshot["brand"]["profile"]["roles"]) : {},
        voice: { ...base.brand.profile.voice, ...(isObject(brand.voice) ? brand.voice : {}) },
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
    throw new Error("The fonts in this file aren't valid.");
  }
  return snapshot;
}

/** Parses an exported project or project list. Throws a readable error for anything else. */
export function parseProjectsFile(text: string): ProjectEntry[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!isObject(data)) throw new Error("That file isn't a DesignHub project.");
  if (data.format === PROJECT_FORMAT) {
    return [{ favorite: data.favorite === true, snapshot: normalizeSnapshot(data.snapshot) }];
  }
  if (data.format === PROJECTS_FORMAT && Array.isArray(data.projects)) {
    return data.projects.map((entry) => {
      if (!isObject(entry)) throw new Error("A project in this file is damaged.");
      return { favorite: entry.favorite === true, snapshot: normalizeSnapshot(entry.snapshot) };
    });
  }
  if (data.format === "designhub.brand") {
    throw new Error("That is a Brand JSON export (tokens only). Import a project file instead.");
  }
  throw new Error("That file isn't a DesignHub project.");
}
