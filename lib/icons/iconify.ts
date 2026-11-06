import type { IconifyJSON } from "@iconify/types";
import { getIconData } from "@iconify/utils";

import { safeDb } from "@/lib/db";
import type { IconCollection, IconData, IconId } from "@/types/icons";

/** Iconify's public API and its official mirrors, tried in order. No API key is needed. */
const ICONIFY_HOSTS = ["https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"];
const REQUEST_TIMEOUT = 8000;
/** Names per request; keeps URLs well under common length limits. */
const CHUNK = 64;

const memory = new Map<IconId, IconData>();
const responses = new Map<string, Promise<unknown>>();

class IconifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IconifyError";
  }
}

/** Empties the icon cache (this tab's and the saved one) and nothing else. Icons are fetched again when they are used. */
export async function clearIconCache(): Promise<void> {
  memory.clear();
  responses.clear();
  await safeDb((db) => db.icons.clear(), undefined);
}

export function splitIconId(id: string): { prefix: string; name: string } {
  const index = id.indexOf(":");
  return { prefix: id.slice(0, index), name: id.slice(index + 1) };
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** GET a JSON path from the first host that answers, with a timeout per attempt. */
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = null;
  for (const host of ICONIFY_HOSTS) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const forward = () => controller.abort();
    signal?.addEventListener("abort", forward, { once: true });
    try {
      const response = await fetch(`${host}${path}`, { signal: controller.signal });
      if (response.status === 404) throw new IconifyError("Not found");
      if (!response.ok) throw new IconifyError(`HTTP ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (error instanceof IconifyError && error.message === "Not found") throw error;
      lastError = error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", forward);
    }
  }
  throw new IconifyError(lastError instanceof Error ? lastError.message : "Iconify is unreachable");
}

/** Memoised GET: identical requests share one promise; failures are not cached. */
function cachedRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const existing = responses.get(path) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = request<T>(path, signal).catch((error: unknown) => {
    responses.delete(path);
    throw error;
  });
  responses.set(path, pending);
  return pending;
}

export type SearchResult = { icons: IconId[]; total: number };

export async function searchIcons(
  query: string,
  options: { prefix?: string; limit?: number; signal?: AbortSignal } = {},
): Promise<SearchResult> {
  const params = new URLSearchParams({ query, limit: String(options.limit ?? 120) });
  if (options.prefix) params.set("prefixes", options.prefix);
  const result = await cachedRequest<{ icons: string[]; total: number }>(`/search?${params}`, options.signal);
  return { icons: result.icons as IconId[], total: result.total };
}

export async function fetchCollections(): Promise<Record<string, IconCollection>> {
  const data = await cachedRequest<Record<string, Omit<IconCollection, "prefix">>>("/collections");
  return Object.fromEntries(Object.entries(data).map(([prefix, info]) => [prefix, { ...info, prefix }]));
}

type CollectionListing = { uncategorized?: string[]; categories?: Record<string, string[]>; hidden?: string[] };

export async function fetchCollectionIcons(prefix: string, signal?: AbortSignal): Promise<IconId[]> {
  const data = await cachedRequest<CollectionListing>(`/collection?prefix=${encodeURIComponent(prefix)}`, signal);
  const names = new Set<string>([...(data.uncategorized ?? []), ...Object.values(data.categories ?? {}).flat()]);
  return [...names].map((name) => `${prefix}:${name}` as IconId);
}

export type FetchIconsOptions = {
  signal?: AbortSignal;
  /** Called with everything resolved so far, so grids can render progressively. */
  onProgress?: (icons: Map<IconId, IconData>) => void;
};

export type FetchIconsResult = { icons: Map<IconId, IconData>; failed: IconId[] };

/**
 * Resolves icon bodies: memory → IndexedDB (best effort) → network, batched per collection.
 * Unknown names are skipped; names whose request failed are reported in `failed`.
 */
export async function fetchIcons(ids: IconId[], options: FetchIconsOptions = {}): Promise<FetchIconsResult> {
  const { signal, onProgress } = options;
  const result = new Map<IconId, IconData>();
  let pending = ids.filter((id) => {
    const cached = memory.get(id);
    if (cached) result.set(id, cached);
    return !cached;
  });

  if (pending.length) {
    const rows = await safeDb((db) => db.icons.bulkGet(pending), []);
    rows.forEach((row) => {
      if (!row) return;
      const data: IconData = { body: row.body, width: row.width, height: row.height, left: row.left, top: row.top };
      memory.set(row.id as IconId, data);
      result.set(row.id as IconId, data);
    });
    pending = pending.filter((id) => !result.has(id));
  }
  if (result.size) onProgress?.(new Map(result));

  const batches: { prefix: string; names: string[] }[] = [];
  const byPrefix = new Map<string, string[]>();
  pending.forEach((id) => {
    const { prefix, name } = splitIconId(id);
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), name]);
  });
  byPrefix.forEach((names, prefix) => {
    for (let i = 0; i < names.length; i += CHUNK) batches.push({ prefix, names: names.slice(i, i + CHUNK) });
  });

  const failed: IconId[] = [];
  await Promise.all(
    batches.map(async ({ prefix, names }) => {
      try {
        const json = await request<IconifyJSON>(`/${prefix}.json?icons=${names.join(",")}`, signal);
        const records = names.flatMap((name) => {
          const icon = getIconData(json, name);
          if (!icon) return [];
          const data: IconData = {
            body: icon.body,
            width: icon.width ?? 16,
            height: icon.height ?? 16,
            left: icon.left,
            top: icon.top,
          };
          const id = `${prefix}:${name}` as IconId;
          memory.set(id, data);
          result.set(id, data);
          return [{ id, ...data, cachedAt: Date.now() }];
        });
        onProgress?.(new Map(result));
        if (records.length) void safeDb((db) => db.icons.bulkPut(records), undefined);
      } catch (error) {
        if (isAbort(error)) throw error;
        // A 404 means the collection doesn't exist; anything else is a failed request worth retrying.
        if (!(error instanceof IconifyError && error.message === "Not found")) {
          names.forEach((name) => failed.push(`${prefix}:${name}` as IconId));
        }
      }
    }),
  );

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (result.size === 0 && failed.length > 0) throw new IconifyError("Iconify is unreachable");
  return { icons: result, failed };
}

export const featuredIcons: IconId[] = [
  "lucide:house",
  "lucide:search",
  "lucide:heart",
  "lucide:star",
  "lucide:settings",
  "lucide:bell",
  "lucide:user",
  "lucide:mail",
  "lucide:camera",
  "lucide:calendar",
  "lucide:cloud",
  "lucide:zap",
  "tabler:brand-github",
  "tabler:palette",
  "tabler:typography",
  "tabler:vector-bezier",
  "tabler:rocket",
  "tabler:bolt",
  "ph:sparkle",
  "ph:paint-brush",
  "ph:compass",
  "ph:lightbulb",
  "ph:leaf",
  "ph:planet",
  "mdi:language-typescript",
  "mdi:react",
  "ri:figma-line",
  "mdi:language-css3",
  "solar:magic-stick-3-linear",
  "solar:pallete-2-linear",
  "solar:layers-linear",
  "solar:crown-linear",
  "iconoir:design-pencil",
  "iconoir:color-filter",
  "iconoir:frame-tool",
  "iconoir:sparks",
  "heroicons:swatch",
  "heroicons:cube",
  "heroicons:command-line",
  "heroicons:photo",
  "fluent:design-ideas-24-regular",
  "fluent:color-24-regular",
  "fluent:text-font-24-regular",
  "fluent:shapes-24-regular",
  "material-symbols:brush-outline",
  "material-symbols:grid-view-outline",
  "material-symbols:format-shapes-outline",
  "material-symbols:auto-awesome-outline",
];
