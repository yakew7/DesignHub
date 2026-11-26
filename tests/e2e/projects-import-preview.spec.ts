import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { hydrated } from "./storage";

type Entry = {
  favorite: boolean;
  tags: string[];
  snapshot: { brand: { profile: { name: string; description: string } } };
  history: { createdAt: number; reason: string; snapshot: unknown }[];
};

const names = ["Preview Alpha", "Preview Beta", "Preview Gamma"];
const tags = [["client"], ["internal", "draft"], []];

/** A project file of three projects, each with two saved versions, written to disk. */
function writeProjectFile(change?: (entry: Entry) => void): string {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  expect(template.history.length).toBeGreaterThanOrEqual(2);
  fixture.projects = names.map((name, index) => {
    const copy = structuredClone(template);
    copy.tags = tags[index] ?? [];
    copy.favorite = false;
    copy.snapshot.brand.profile.name = name;
    copy.history = copy.history.slice(0, 2);
    change?.(copy);
    return copy;
  });
  const file = test.info().outputPath("preview-source.json");
  writeFileSync(file, JSON.stringify(fixture));
  return file;
}

/** The names of the projects stored in the browser, read with raw indexedDB. */
const storedNames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result.transaction("summaries").objectStore("summaries").getAll();
          request.onsuccess = () => {
            open.result.close();
            resolve((request.result as { name: string }[]).map((row) => row.name));
          };
          request.onerror = () => reject(request.error);
        };
      }),
  );

async function openPreview(page: Page) {
  await page.goto("/projects");
  await hydrated(page);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(writeProjectFile());
  const dialog = page.getByRole("dialog", { name: "Choose what to import" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("a file of three projects asks which to import, shows what each holds, and imports only the checked ones", async ({
  page,
}) => {
  const dialog = await openPreview(page);

  // Each project is listed with its tags, its versions and its size, all checked, and nothing is imported yet.
  const boxes = dialog.getByRole("checkbox");
  await expect(boxes).toHaveCount(3);
  for (const [index, name] of names.entries()) {
    const box = boxes.nth(index);
    await expect(box).toBeChecked();
    await expect(box).toHaveAccessibleName(new RegExp(`^${name}`));
    await expect(box).toHaveAccessibleName(/2 versions/);
    await expect(box).toHaveAccessibleName(/\d+(\.\d+)? (B|KB|MB)$/);
  }
  await expect(boxes.nth(0)).toHaveAccessibleName(/client/);
  await expect(boxes.nth(1)).toHaveAccessibleName(/internal, draft/);
  await expect(dialog.getByRole("button", { name: "Import 3 projects" })).toBeVisible();
  for (const name of names) await expect(page.getByRole("heading", { name, level: 2 })).toHaveCount(0);

  // Keyboard: focus starts on the first project, Space unchecks it and Tab moves on to the next.
  await expect(boxes.nth(0)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(boxes.nth(0)).not.toBeChecked();
  await expect(dialog.getByRole("button", { name: "Import 2 projects" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(boxes.nth(0)).toBeChecked();

  // Escape cancels: nothing is imported, and focus goes back to the menu that started the import.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeFocused();
  for (const name of names) await expect(page.getByRole("heading", { name, level: 2 })).toHaveCount(0);
  expect(await storedNames(page)).not.toContain(names[0]);

  // Choose the file again, leave the last project out and import the other two.
  await page.locator('input[type="file"]').first().setInputFiles(writeProjectFile());
  await expect(dialog).toBeVisible();
  await boxes.nth(2).uncheck();
  await dialog.getByRole("button", { name: "Import 2 projects" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Imported 2 projects")).toBeVisible();
  for (const name of names.slice(0, 2)) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: names[2]!, level: 2 })).toHaveCount(0);
  await expect.poll(() => storedNames(page)).toEqual(expect.arrayContaining(names.slice(0, 2)));
  expect(await storedNames(page)).not.toContain(names[2]);

  // The same file again: the two already here are marked and skipped at first, and only the third is a new row.
  await page.locator('input[type="file"]').first().setInputFiles(writeProjectFile());
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Already here")).toHaveCount(2);
  await expect(boxes).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: "Import 1 project", exact: true })).toBeVisible();
  await boxes.nth(0).uncheck();
  await expect(dialog.getByRole("button", { name: "Import 0 projects" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect((await storedNames(page)).filter((name) => name.startsWith("Preview Alpha"))).toEqual(["Preview Alpha"]);

  // Names stay unique: a project with the name of one already here but other contents is a new project, added as "(2)".
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(
      writeProjectFile((entry) => {
        if (entry.snapshot.brand.profile.name === names[0]) entry.snapshot.brand.profile.description = "Another brand";
      }),
    );
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Select none" }).click();
  await boxes.nth(0).check();
  await dialog.getByRole("button", { name: "Import 1 project", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Preview Alpha (2)", level: 2 })).toBeVisible();
});

test("the import preview passes the axe scan in light and dark", async ({ page }) => {
  const dialog = await openPreview(page);
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await expect(dialog).toBeVisible();
    const analysis = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const found = analysis.violations.map(
      (violation) =>
        `${violation.id} (${violation.impact}) at ${violation.nodes.map((node) => node.target).join(", ")}`,
    );
    expect(found, `axe in ${theme}`).toEqual([]);
  }
});
