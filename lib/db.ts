import type { Dexie, EntityTable } from "dexie";
import type { StateStorage } from "zustand/middleware";

import type { StoredVersion } from "@/lib/projects/version-storage";
import type { BrandProject, ProjectListItem } from "@/lib/projects/types";

type KeyValueRecord = {
  key: string;
  value: string;
  updatedAt: number;
};

type CachedIconRecord = {
  id: string;
  body: string;
  width: number;
  height: number;
  left?: number;
  top?: number;
  cachedAt: number;
};

/** The folder DesignHub also writes projects to. Directory handles are structured-cloneable, so they live in IndexedDB. */
export type FolderRecord = {
  key: string;
  handle: FileSystemDirectoryHandle;
  name: string;
  connectedAt: number;
};

type DesignHubDatabase = Dexie & {
  kv: EntityTable<KeyValueRecord, "key">;
  icons: EntityTable<CachedIconRecord, "id">;
  projects: EntityTable<BrandProject, "id">;
  /** One small row per project (name, times, tags), so the list does not read whole projects. */
  summaries: EntityTable<ProjectListItem, "id">;
  versions: EntityTable<StoredVersion, "id">;
  handles: EntityTable<FolderRecord, "key">;
};

/** Opens the database. Dexie is loaded on first use, so it stays out of every page's first load. */
async function createDatabase(): Promise<DesignHubDatabase> {
  const { default: DexieClass } = await import("dexie");
  const db = new DexieClass("designhub") as DesignHubDatabase;
  db.version(1).stores({ kv: "key, updatedAt" });
  // v2: offline cache for Iconify glyphs the user has already seen.
  db.version(2).stores({ kv: "key, updatedAt", icons: "id, cachedAt" });
  // v3: local brand projects, each a full snapshot of the brand-defining stores.
  db.version(3).stores({ kv: "key, updatedAt", icons: "id, cachedAt", projects: "id, updatedAt, lastOpenedAt" });
  // v4: version history per project. Only a new table, so older databases keep every row.
  db.version(4).stores({
    kv: "key, updatedAt",
    icons: "id, cachedAt",
    projects: "id, updatedAt, lastOpenedAt",
    versions: "id, projectId, createdAt",
  });
  // v5: the local folder for project autosave. Only a new table, so older databases keep every row.
  db.version(5).stores({
    kv: "key, updatedAt",
    icons: "id, cachedAt",
    projects: "id, updatedAt, lastOpenedAt",
    versions: "id, projectId, createdAt",
    handles: "key",
  });
  // v6: a summary row per project for the project list. Only a new table, so older databases keep every row; the
  // rows are written when a project is saved and filled in for older projects the first time the list opens.
  db.version(6).stores({
    kv: "key, updatedAt",
    icons: "id, cachedAt",
    projects: "id, updatedAt, lastOpenedAt",
    versions: "id, projectId, createdAt",
    handles: "key",
    summaries: "id",
  });
  // An older tab must let go, or this tab's upgrade would block forever.
  db.on("versionchange", () => {
    db.close();
    return false;
  });
  return db;
}

let database: Promise<DesignHubDatabase | null> | null = null;
/** Set once IndexedDB has failed (private mode, blocked upgrade…); the app then runs memory-only. */
let unavailable = false;

/** False once IndexedDB has failed; features then keep data in memory for the session. */
export function databaseAvailable(): boolean {
  return !unavailable && typeof indexedDB !== "undefined";
}

export function getDatabase(): Promise<DesignHubDatabase | null> {
  if (unavailable || typeof indexedDB === "undefined") return Promise.resolve(null);
  database ??= createDatabase().catch(() => {
    unavailable = true;
    return null;
  });
  return database;
}

const DB_TIMEOUT = 2000;

/**
 * Runs a Dexie operation that must never break the app: it resolves to `fallback`
 * on error or after a timeout, and disables IndexedDB for the session on failure.
 */
export async function safeDb<T>(operation: (db: DesignHubDatabase) => Promise<T>, fallback: T): Promise<T> {
  // The timeout covers the operation, not loading Dexie on a slow connection.
  const db = await getDatabase();
  if (!db) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      unavailable = true;
      resolve(fallback);
    }, DB_TIMEOUT);
  });
  try {
    return await Promise.race([operation(db), timeout]);
  } catch {
    unavailable = true;
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Zustand `persist` storage backed by IndexedDB (via Dexie).
 * Falls back to memory-only (a no-op) on the server, without IndexedDB, or when it fails.
 */
export const indexedDbStorage: StateStorage = {
  async getItem(name) {
    const record = await safeDb((db) => db.kv.get(name), undefined);
    return record?.value ?? null;
  },
  async setItem(name, value) {
    await safeDb((db) => db.kv.put({ key: name, value, updatedAt: Date.now() }), undefined);
  },
  async removeItem(name) {
    await safeDb((db) => db.kv.delete(name), undefined);
  },
};
