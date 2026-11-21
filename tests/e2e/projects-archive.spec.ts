import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { hydrated } from "./storage";

type Entry = {
  favorite: boolean;
  tags: string[];
  snapshot: { brand: { profile: { name: string } } };
  history: { createdAt: number; reason: string; snapshot: unknown }[];
};

const names = ["Archive Alpha", "Archive Beta", "Archive Gamma"];

/** Every row of one IndexedDB table, read with raw indexedDB. */
const rows = (page: Page, table: "projects" | "summaries" | "versions") =>
  page.evaluate(
    (name) =>
      new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result.transaction(name).objectStore(name).getAll();
          request.onsuccess = () => {
            open.result.close();
            resolve(request.result as Record<string, unknown>[]);
          };
          request.onerror = () => reject(request.error);
        };
      }),
    table,
  );

type Stored = { id: string; name?: string; snapshot?: { brand: { profile: { name: string } } }; projectId?: string };

const nameOf = (row: Stored) => row.name ?? row.snapshot?.brand.profile.name ?? "";

/** The ids, by name, of the projects stored under the three test names. */
async function storedIds(page: Page): Promise<Map<string, string>> {
  const projects = (await rows(page, "projects")) as Stored[];
  return new Map(projects.filter((row) => names.includes(nameOf(row))).map((row) => [nameOf(row), row.id]));
}

/** How many of each table's rows belong to the project names given (the projects, their summaries and versions). */
async function counts(page: Page, ids: string[]) {
  const projects = (await rows(page, "projects")) as Stored[];
  const summaries = (await rows(page, "summaries")) as Stored[];
  const versions = (await rows(page, "versions")) as Stored[];
  return {
    projects: projects.filter((row) => ids.includes(row.id)).length,
    summaries: summaries.filter((row) => ids.includes(row.id)).length,
    versions: versions.filter((row) => ids.includes(row.projectId ?? "")).length,
  };
}

/** A project file of three projects, each with two saved versions, written to disk. */
function writeProjectFile(): string {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  expect(template.history.length).toBeGreaterThanOrEqual(2);
  fixture.projects = names.map((name) => {
    const copy = structuredClone(template);
    copy.tags = [];
    copy.favorite = false;
    copy.snapshot.brand.profile.name = name;
    copy.history = copy.history.slice(0, 2);
    return copy;
  });
  const file = test.info().outputPath("archive-source.json");
  writeFileSync(file, JSON.stringify(fixture));
  return file;
}

async function importThree(page: Page) {
  await page.goto("/projects");
  await hydrated(page);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(writeProjectFile());
  for (const name of names) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
}

test("archiving two projects saves them with history to one file, removes them, imports back, and Undo restores them", async ({
  page,
}) => {
  await importThree(page);
  const ids = await storedIds(page);
  const [alpha, beta, gamma] = names.map((name) => ids.get(name) ?? "");
  expect([alpha, beta, gamma].every(Boolean)).toBe(true);
  await expect.poll(() => counts(page, [alpha, beta])).toEqual({ projects: 2, summaries: 2, versions: 4 });

  await page.getByRole("button", { name: "Select", exact: true }).click();
  const bar = page.getByRole("region", { name: "Actions for the selected projects" });
  await page.getByRole("checkbox", { name: "Select Archive Alpha" }).check();
  await page.getByRole("checkbox", { name: "Select Archive Beta" }).check();
  await expect(bar).toContainText("2 projects selected");

  const download = page.waitForEvent("download");
  await bar.getByRole("button", { name: "Archive", exact: true }).click();
  const archive = await download;
  expect(archive.suggestedFilename()).toMatch(/^designhub-archive-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await archive.path();
  const file = JSON.parse(readFileSync(path, "utf8")) as { format: string; projects: Entry[] };
  expect(file.format).toBe("designhub.projects");
  expect(file.projects.map((item) => item.snapshot.brand.profile.name).sort()).toEqual([
    "Archive Alpha",
    "Archive Beta",
  ]);
  expect(file.projects.map((item) => item.history.length)).toEqual([2, 2]);

  // They are gone from the list and from the three tables, and the others stay.
  await expect(page.getByText("Archived 2 projects to a file")).toBeVisible();
  for (const name of ["Archive Alpha", "Archive Beta"]) {
    await expect(page.getByRole("heading", { name, level: 2 })).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { name: "Archive Gamma", level: 2 })).toBeVisible();
  await expect.poll(() => counts(page, [alpha, beta])).toEqual({ projects: 0, summaries: 0, versions: 0 });
  expect(await counts(page, [gamma])).toEqual({ projects: 1, summaries: 1, versions: 2 });

  // Undo puts them back, with their rows and history.
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Restored 2 projects")).toBeVisible();
  for (const name of ["Archive Alpha", "Archive Beta"]) {
    await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  }
  await expect.poll(() => counts(page, [alpha, beta])).toEqual({ projects: 2, summaries: 2, versions: 4 });

  // Archive them again and bring the file back: both return with their history, as new projects.
  await page.getByRole("checkbox", { name: "Select Archive Alpha" }).check();
  await page.getByRole("checkbox", { name: "Select Archive Beta" }).check();
  const second = page.waitForEvent("download");
  await bar.getByRole("button", { name: "Archive", exact: true }).click();
  const again = await (await second).path();
  await expect.poll(() => counts(page, [alpha, beta])).toEqual({ projects: 0, summaries: 0, versions: 0 });
  await expect(page.getByRole("heading", { name: "Archive Alpha", level: 2 })).toHaveCount(0);

  await page.locator('input[type="file"]').first().setInputFiles(again);
  for (const name of ["Archive Alpha", "Archive Beta"]) {
    await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  }
  const back = await storedIds(page);
  const returned = [back.get("Archive Alpha") ?? "", back.get("Archive Beta") ?? ""];
  expect(returned.every(Boolean)).toBe(true);
  await expect.poll(() => counts(page, returned)).toEqual({ projects: 2, summaries: 2, versions: 4 });
});

test("the open project is never archived, and the near-full note starts select mode", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.storage, "estimate", {
      value: async () => ({ usage: 85_000_000, quota: 100_000_000 }),
    });
  });
  await importThree(page);

  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await expect(page.getByText(/Storage is 85% full/)).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Archive projects" }).click();

  // Select mode is on, and focus is on the bar so the next key press is a choice.
  const bar = page.getByRole("region", { name: "Actions for the selected projects" });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("button", { name: "Select all shown" })).toBeFocused();

  const openButton = page.getByRole("button", { name: /\(open\)$/ });
  const openName = ((await openButton.getAttribute("aria-label")) ?? (await openButton.innerText())).replace(
    / \(open\)$/,
    "",
  );
  await bar.getByRole("button", { name: "Select all shown" }).click();
  const total = await page.getByRole("checkbox").count();
  await expect(bar).toContainText(`${total} projects selected`);

  const download = page.waitForEvent("download");
  await bar.getByRole("button", { name: "Archive", exact: true }).click();
  const file = JSON.parse(readFileSync(await (await download).path(), "utf8")) as { projects: Entry[] };
  const archived = file.projects.map((item) => item.snapshot.brand.profile.name);
  expect(archived).toHaveLength(total - 1);
  expect(archived).not.toContain(openName);

  await expect(page.getByText(`Archived ${total - 1} projects to a file`)).toBeVisible();
  await expect(page.getByText("The open project was kept.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: openName, level: 2 })).toBeVisible();
  for (const name of names) await expect(page.getByRole("heading", { name, level: 2 })).toHaveCount(0);
});
