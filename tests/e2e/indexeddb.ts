import type { Page } from "@playwright/test";

/** The rows of the DesignHub database at version 5, one list per table (see lib/projects/__fixtures__/v5). */
export type VersionFiveRows = {
  kv: object[];
  icons: object[];
  projects: object[];
  versions: object[];
  handles: object[];
};

/** Dexie opens a database it calls version N as IndexedDB version N * 10, so Dexie's version 5 is 50. */
export const DEXIE_VERSION_FIVE = 50;

/**
 * Creates the `designhub` database as the version 5 build left it, with raw IndexedDB and no Dexie, so the app
 * finds a real older database and upgrades it when it opens. Call it before the first visit to the app: it goes
 * to a plain text page of the same site (so the app's own code is not running and cannot open the database
 * first), writes the tables and closes the connection (an open one would block the upgrade).
 */
export async function createVersionFiveDatabase(page: Page, rows: VersionFiveRows) {
  await page.goto("/robots.txt");
  await page.evaluate(
    ([version, data]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("designhub", version);
        open.onerror = () => reject(open.error);
        open.onupgradeneeded = () => {
          const db = open.result;
          // The tables and indexes db.version(5) declares in lib/db.ts.
          db.createObjectStore("kv", { keyPath: "key" }).createIndex("updatedAt", "updatedAt");
          db.createObjectStore("icons", { keyPath: "id" }).createIndex("cachedAt", "cachedAt");
          const projects = db.createObjectStore("projects", { keyPath: "id" });
          projects.createIndex("updatedAt", "updatedAt");
          projects.createIndex("lastOpenedAt", "lastOpenedAt");
          const versions = db.createObjectStore("versions", { keyPath: "id" });
          versions.createIndex("projectId", "projectId");
          versions.createIndex("createdAt", "createdAt");
          db.createObjectStore("handles", { keyPath: "key" });
          const transaction = open.transaction;
          if (!transaction) return reject(new Error("no upgrade transaction"));
          for (const [table, list] of Object.entries(data)) {
            for (const row of list) transaction.objectStore(table).put(row);
          }
        };
        open.onsuccess = () => {
          open.result.close();
          resolve();
        };
      }),
    [DEXIE_VERSION_FIVE, rows] as const,
  );
}

/** The database as it is now: its IndexedDB version and the names of its tables, sorted. */
export async function databaseShape(page: Page): Promise<{ version: number; tables: string[] }> {
  return page.evaluate(
    () =>
      new Promise<{ version: number; tables: string[] }>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const shape = { version: db.version, tables: Array.from(db.objectStoreNames).sort() };
          db.close();
          resolve(shape);
        };
      }),
  );
}

/** Every row of one table, read with the raw IndexedDB API. */
export async function readTable<Row>(page: Page, table: string): Promise<Row[]> {
  return page.evaluate(
    (name) =>
      new Promise<Row[]>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(name)) {
            db.close();
            return resolve([]);
          }
          const request = db.transaction(name).objectStore(name).getAll();
          request.onsuccess = () => {
            db.close();
            resolve(request.result as Row[]);
          };
          request.onerror = () => reject(request.error);
        };
      }),
    table,
  );
}
