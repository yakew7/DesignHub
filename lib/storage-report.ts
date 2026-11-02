import { byteLength } from "@/lib/svg-size";

/** The offline caches the service worker keeps. `designhub-share` holds a file mid-import and is left alone. */
export const isOfflineCache = (name: string): boolean =>
  name.startsWith("designhub-static-") || name.startsWith("designhub-runtime-");

/** Counts and sizes of a list of stored rows, measured as the JSON they hold. Never reads a row's content out. */
export function measureRows(rows: readonly unknown[]): { count: number; bytes: number } {
  let bytes = 0;
  for (const row of rows) bytes += byteLength(JSON.stringify(row) ?? "");
  return { count: rows.length, bytes };
}

/** The share of the browser's quota in use, as a whole percent, or null when either number is unknown. */
export function quotaShare(usage: number | undefined, quota: number | undefined): number | null {
  if (!usage || !quota || quota <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((usage / quota) * 100)));
}

/** The part of `CacheStorage` this file uses, so a test can stand in for it. */
export type CacheStore = {
  keys: () => Promise<string[]>;
  delete: (name: string) => Promise<boolean>;
};

/** Deletes the offline caches and nothing else. Returns how many were deleted. */
export async function clearOfflineCaches(store: CacheStore): Promise<number> {
  const names = (await store.keys()).filter(isOfflineCache);
  const results = await Promise.all(names.map((name) => store.delete(name)));
  return results.filter(Boolean).length;
}

/** Entries and bytes of the offline caches. A response from another origin has no readable size and counts as 0. */
export async function measureOfflineCaches(
  store: CacheStorage,
): Promise<{ caches: number; files: number; bytes: number }> {
  const names = (await store.keys()).filter(isOfflineCache);
  let files = 0;
  let bytes = 0;
  for (const name of names) {
    const cache = await store.open(name);
    const requests = await cache.keys();
    files += requests.length;
    for (const request of requests) {
      const response = await cache.match(request);
      if (!response || response.type === "opaque") continue;
      bytes += (await response.clone().arrayBuffer()).byteLength;
    }
  }
  return { caches: names.length, files, bytes };
}

/** The part of `navigator.storage` the protection check uses, so a test can stand in for it. */
export type PersistentStorage = { persisted?: () => Promise<boolean>; persist?: () => Promise<boolean> };

export type Protection = "protected" | "not-protected" | "unsupported";

/** Whether the browser has promised to keep this site's data, or cannot say. */
export async function protectionOf(storage: PersistentStorage | undefined): Promise<Protection> {
  if (!storage?.persisted) return "unsupported";
  try {
    return (await storage.persisted()) ? "protected" : "not-protected";
  } catch {
    return "unsupported";
  }
}

/** Asks the browser to keep the data. Returns the state afterwards: a browser may say no, and then it stays not protected. */
export async function requestProtection(storage: PersistentStorage | undefined): Promise<Protection> {
  if (!storage?.persist) return "unsupported";
  try {
    await storage.persist();
  } catch {
    // A refusal and an error leave the data as it was; the state below says which.
  }
  return protectionOf(storage);
}
