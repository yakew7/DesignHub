import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

async function create(page: Page, name: string) {
  await page.getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New brand project" });
  await dialog.getByLabel("Brand name").fill(name);
  await dialog.getByRole("button", { name: "Create and open" }).click();
  await expect(dialog).toBeHidden();
  // The new project is written to storage a moment after the dialog closes; leave the page only once it is listed.
  await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
}

test("select several projects, tag them, export them, and delete them with one undo, keeping the open one", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
  await create(page, "Selected One");
  await create(page, "Open One");

  // Which project is open is whatever the page says; the others are what a bulk delete may remove.
  const openButton = page.getByRole("button", { name: /\(open\)$/ });
  const openName = ((await openButton.getAttribute("aria-label")) ?? (await openButton.innerText())).replace(
    / \(open\)$/,
    "",
  );
  const others = ["Acme", "Selected One", "Open One"].filter((name) => name !== openName);
  expect(others).toHaveLength(2);

  // Nothing changes until Select is pressed: no checkboxes.
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const bar = page.getByRole("region", { name: "Actions for the selected projects" });
  await expect(bar).toContainText("0 projects selected");

  for (const name of others) await page.getByRole("checkbox", { name: `Select ${name}` }).check();
  await expect(bar).toContainText("2 projects selected");

  // Tag both.
  await bar.getByLabel("Tag to add").fill("batch");
  await bar.getByRole("button", { name: "Add tag" }).click();
  await expect(page.getByText("Tagged 2 projects")).toBeVisible();
  for (const name of others) {
    await expect(page.getByRole("button", { name: `Remove tag batch from ${name}` })).toBeVisible();
  }

  // Export them as one ZIP.
  const download = page.waitForEvent("download");
  await bar.getByRole("button", { name: "Export ZIP" }).click();
  expect((await download).suggestedFilename()).toMatch(/^designhub-projects-.*\.zip$/);

  // Select all shown, then delete: the open project stays, the others go, and one Undo brings them back.
  await bar.getByRole("button", { name: "Select all shown" }).click();
  await bar.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Deleted 2 projects")).toBeVisible();
  await expect(page.getByText("The open project was kept.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: openName, level: 2 })).toBeVisible();
  for (const name of others) await expect(page.getByRole("heading", { name, level: 2 })).toHaveCount(0);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Restored 2 projects")).toBeVisible();
  for (const name of others) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();

  await bar.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("Shift and click selects a range, and Select tagged adds every project with a tag", async ({ page }) => {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0];
  fixture.projects = Array.from({ length: 12 }, (_, index) => {
    const copy = structuredClone(template);
    copy.favorite = false;
    copy.tags = [index % 4 === 0 ? "archived" : "active"];
    copy.snapshot.brand.profile.name = `Brand ${String(index).padStart(2, "0")}`;
    return copy;
  });
  const file = join(tmpdir(), "designhub-select-range.json");
  writeFileSync(file, JSON.stringify(fixture));

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(page.getByRole("button", { name: "Open Brand 11" })).toBeVisible();

  await page.getByRole("button", { name: "Select", exact: true }).click();
  const bar = page.getByRole("region", { name: "Actions for the selected projects" });
  // The cards are in the order shown (projects created in the same millisecond have no fixed order, so the test goes by
  // position, not by name): a click on the first, then Shift and click on the fourth, selects the first four.
  const boxes = page.getByRole("checkbox");
  await boxes.nth(0).click();
  await expect(bar).toContainText("1 project selected");
  await boxes.nth(3).click({ modifiers: ["Shift"] });
  await expect(bar).toContainText("4 projects selected");
  for (const index of [0, 1, 2, 3]) await expect(boxes.nth(index)).toBeChecked();
  await expect(boxes.nth(4)).not.toBeChecked();

  // Select tagged adds every archived project (00, 04 and 08), whichever of them were already in the range.
  const before = await boxes.evaluateAll((all) => all.filter((box) => (box as HTMLInputElement).checked).length);
  await bar.getByRole("combobox", { name: "Select tagged" }).click();
  await page.getByRole("option", { name: "archived" }).click();
  for (const name of ["Brand 00", "Brand 04", "Brand 08"]) {
    await expect(page.getByRole("checkbox", { name: `Select ${name}` })).toBeChecked();
  }
  const after = await boxes.evaluateAll((all) => all.filter((box) => (box as HTMLInputElement).checked).length);
  expect(after).toBeGreaterThanOrEqual(before);
});

test("the favorites and tag filters are remembered, and a tag nobody has is ignored", async ({ page }) => {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0];
  fixture.projects = ["alpha", "beta", "alpha"].map((tag, index) => {
    const copy = structuredClone(template);
    copy.favorite = false;
    copy.tags = [tag];
    copy.snapshot.brand.profile.name = `Filter ${index}`;
    return copy;
  });
  const file = join(tmpdir(), "designhub-filters.json");
  writeFileSync(file, JSON.stringify(fixture));

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(page.getByRole("button", { name: "Open Filter 2" })).toBeVisible();

  await page.getByRole("combobox", { name: "Filter by tag" }).click();
  await page.getByRole("option", { name: "beta" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Filters on: showing 1 of" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Filter 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Filter 0" })).toHaveCount(0);

  // Written a moment later; wait for it before leaving the page.
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: "Filters on: showing 1 of" })).toBeVisible();
  await expect(page.getByLabel("Search projects")).toHaveValue("");

  // Clearing the filters brings every project back, and it is remembered too.
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("button", { name: "Open Filter 0" })).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
});
