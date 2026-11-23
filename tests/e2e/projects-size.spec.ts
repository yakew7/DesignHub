import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { confirmImport, hydrated } from "./storage";

type Entry = {
  favorite: boolean;
  tags: string[];
  snapshot: { brand: { profile: { name: string; logoSvg: string | null } } };
  history: unknown[];
};

/** Three projects that differ only in the size of their logo, so their sizes are far apart. */
const sizes = [
  ["Size Small", 1],
  ["Size Large", 400],
  ["Size Medium", 60],
] as const;

const logoOf = (shapes: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${Array.from(
    { length: shapes },
    (_, index) => `<rect x="${index % 90}" y="${index % 90}" width="5" height="5" fill="#336699"/>`,
  ).join("")}</svg>`;

function writeProjectFile(): string {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  fixture.projects = sizes.map(([name, shapes]) => {
    const copy = structuredClone(template);
    copy.tags = [];
    copy.favorite = false;
    copy.history = [];
    copy.snapshot.brand.profile.name = name;
    copy.snapshot.brand.profile.logoSvg = logoOf(shapes);
    return copy;
  });
  const file = test.info().outputPath("size-source.json");
  writeFileSync(file, JSON.stringify(fixture));
  return file;
}

type Row = { id: string; name?: string; bytes?: number; snapshot?: { brand: { profile: { name: string } } } };

/** Every project row and summary row, with the bytes the project row measures as JSON, read with raw indexedDB. */
const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ summaries: Row[]; measured: Record<string, number> }>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const transaction = open.result.transaction(["projects", "summaries"]);
          const projects = transaction.objectStore("projects").getAll();
          const summaries = transaction.objectStore("summaries").getAll();
          transaction.oncomplete = () => {
            open.result.close();
            const measured: Record<string, number> = {};
            for (const row of projects.result as Row[]) {
              measured[row.id] = new TextEncoder().encode(JSON.stringify(row)).length;
            }
            resolve({ summaries: summaries.result as Row[], measured });
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );

/** Removes the size from every summary row, as they are in a database saved before the size was kept. */
const dropSizes = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const transaction = open.result.transaction("summaries", "readwrite");
          const store = transaction.objectStore("summaries");
          const all = store.getAll();
          all.onsuccess = () => {
            for (const row of all.result as Record<string, unknown>[]) {
              delete row.bytes;
              store.put(row);
            }
          };
          transaction.oncomplete = () => {
            open.result.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );

/** The size text a card shows, as `formatBytes` writes it. */
const label = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function importSizes(page: Page) {
  await page.goto("/projects");
  await hydrated(page);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(writeProjectFile());
  await confirmImport(page);
  for (const [name] of sizes) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
}

/** The names of the three test projects, in the order the cards are shown. */
async function shownOrder(page: Page) {
  const headings = await page.getByRole("heading", { level: 2 }).allInnerTexts();
  return headings.filter((name) => sizes.some(([known]) => known === name));
}

test("each card shows its project's size, and Size sorts the largest first", async ({ page }) => {
  await importSizes(page);

  // The summary row holds the size of the project row, and the card shows it.
  await expect
    .poll(async () => (await stored(page)).summaries.filter((row) => row.name?.startsWith("Size ")).length)
    .toBe(3);
  const { summaries, measured } = await stored(page);
  const byName = new Map(summaries.map((row) => [row.name ?? "", row]));
  for (const [name] of sizes) {
    const row = byName.get(name);
    expect(row?.bytes, name).toBe(measured[row?.id ?? ""]);
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name, level: 2 }) });
    await expect(card.locator('[data-slot="project-size"]')).toHaveText(`Size ${label(row?.bytes ?? 0)}`);
  }
  const bytes = (name: string) => byName.get(name)?.bytes ?? 0;
  expect(bytes("Size Large")).toBeGreaterThan(bytes("Size Medium"));
  expect(bytes("Size Medium")).toBeGreaterThan(bytes("Size Small"));

  // Size is a choice in the sort menu, and the order follows it. Newest first would put the last imported on top.
  await page.getByRole("combobox", { name: "Sort projects" }).click();
  await page.getByRole("option", { name: "Size (largest first)" }).click();
  await expect(page.getByRole("combobox", { name: "Sort projects" })).toContainText("Size (largest first)");
  await expect.poll(() => shownOrder(page)).toEqual(["Size Large", "Size Medium", "Size Small"]);

  // Another sort changes the order again, so the test is not passing by accident.
  await page.getByRole("combobox", { name: "Sort projects" }).click();
  await page.getByRole("option", { name: "Name (A to Z)" }).click();
  await expect.poll(() => shownOrder(page)).toEqual(["Size Large", "Size Medium", "Size Small"].sort());
  await page.getByRole("combobox", { name: "Sort projects" }).click();
  await page.getByRole("option", { name: "Size (largest first)" }).click();
  await expect.poll(() => shownOrder(page)).toEqual(["Size Large", "Size Medium", "Size Small"]);
});

test("a summary row saved without a size is measured once and written back", async ({ page }) => {
  await importSizes(page);
  await expect
    .poll(async () => (await stored(page)).summaries.filter((row) => typeof row.bytes === "number").length)
    .toBeGreaterThanOrEqual(3);
  const ours = (rows: Row[]) => rows.filter((row) => row.name?.startsWith("Size "));
  const before = new Map(ours((await stored(page)).summaries).map((row) => [row.id, row.bytes]));

  await dropSizes(page);
  expect((await stored(page)).summaries.every((row) => row.bytes === undefined)).toBe(true);

  await page.reload();
  await hydrated(page);
  for (const [name] of sizes) {
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name, level: 2 }) });
    await expect(card.locator('[data-slot="project-size"]')).toHaveText(/^Size \d/);
  }
  // Every row has its size again, the same as before, and the projects themselves were not changed.
  await expect
    .poll(async () => {
      const { summaries } = await stored(page);
      return ours(summaries).every((row) => row.bytes === before.get(row.id));
    })
    .toBe(true);
  const { summaries, measured } = await stored(page);
  expect(ours(summaries)).toHaveLength(3);
  for (const row of summaries) expect(row.bytes).toBe(measured[row.id]);
});
