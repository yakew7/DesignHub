import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

type Entry = { favorite: boolean; tags: string[]; snapshot: { brand: { profile: { name: string } } } };

const reads = (page: Page) =>
  page.evaluate(() => (window as unknown as { __designhubProjectReads: () => number }).__designhubProjectReads());

const summaryCount = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => resolve(0);
        open.onsuccess = () => {
          if (!open.result.objectStoreNames.contains("summaries")) return resolve(0);
          const request = open.result.transaction("summaries").objectStore("summaries").count();
          request.onsuccess = () => {
            open.result.close();
            resolve(request.result);
          };
        };
      }),
  );

/** Empties the summaries table, as it is in a database saved before the table existed. */
const dropSummaries = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const transaction = open.result.transaction("summaries", "readwrite");
          const store = transaction.objectStore("summaries");
          const count = store.count();
          store.clear();
          transaction.oncomplete = () => {
            open.result.close();
            resolve(count.result);
          };
        };
      }),
  );

test("a database with no summary rows gets them once, and the list then reads no whole project", async ({ page }) => {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  fixture.projects = Array.from({ length: 40 }, (_, index) => {
    const copy = structuredClone(template);
    copy.tags = [];
    copy.snapshot.brand.profile.name = `Summary ${String(index).padStart(2, "0")}`;
    return copy;
  });
  const file = join(tmpdir(), "designhub-summary-projects.json");
  writeFileSync(file, JSON.stringify(fixture));

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(page.getByRole("button", { name: "Open Summary 39" })).toBeVisible();

  // Saved projects have a summary row each (plus the first brand project).
  await expect.poll(() => summaryCount(page)).toBeGreaterThanOrEqual(40);
  await dropSummaries(page);

  // Without the rows the list is rebuilt: every project is read once and the rows are written back.
  await page.reload();
  await expect(page.getByRole("button", { name: "Open Summary 39" })).toBeVisible();
  expect(await reads(page)).toBeGreaterThanOrEqual(40);

  // With them, a reload reads only the open project and the cards near the view.
  await page.reload();
  await expect(page.getByRole("button", { name: "Open Summary 39" })).toBeVisible();
  await expect(page.locator('[data-preview="drawn"]').first()).toBeVisible();
  expect(await reads(page)).toBeLessThan(40);
});
