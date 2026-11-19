import { expect, test, type Page } from "@playwright/test";

import { hydrated } from "./hydrated";
import { readTable } from "./indexeddb";
import { saved } from "./storage";

type Project = {
  id: string;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  snapshot: { brand: { profile: { name: string } } };
};
type Summary = Omit<Project, "snapshot"> & { name: string };

/** The one project and its summary row, as they are in IndexedDB now. */
async function rows(page: Page): Promise<{ project: Project; summary: Summary }> {
  const projects = await readTable<Project>(page, "projects");
  const summaries = await readTable<Summary>(page, "summaries");
  expect(projects).toHaveLength(1);
  expect(summaries).toHaveLength(1);
  return { project: projects[0], summary: summaries[0] };
}

test("the summary row stays in step with the project through a rename, a tag, a favorite and a restore", async ({
  page,
}) => {
  // A first visit to Brand Projects creates the project, and the brand has a name to go back to.
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
  await page.goto("/brand");
  await hydrated(page);
  await page.getByLabel("Brand name").fill("Alpha");
  await saved(page, "designhub:brand", "Alpha");

  // Surprise me keeps the state before it, named Alpha, as a version to restore later.
  await page.getByRole("button", { name: "Surprise me" }).click();
  await expect.poll(async () => (await readTable<object>(page, "versions")).length).toBe(1);

  await page.goto("/projects");
  await hydrated(page);
  await expect(page.getByRole("button", { name: "Alpha (open)" })).toBeVisible();

  // Rename, tag and favorite the project. Each goes through the same save as the row's own write.
  await page.getByRole("button", { name: "Rename Alpha" }).click();
  await page.getByLabel("Project name").fill("Beta Studio");
  await page.getByLabel("Project name").press("Enter");
  await expect(page.getByRole("heading", { name: "Beta Studio", level: 2 })).toBeVisible();
  await saved(page, "designhub:brand", "Beta Studio");

  await page.getByRole("button", { name: "Add a tag to Beta Studio" }).click();
  await page.getByLabel("New tag for Beta Studio").fill("client");
  await page.getByLabel("New tag for Beta Studio").press("Enter");
  await expect(page.getByRole("button", { name: "Remove tag client from Beta Studio" })).toBeVisible();

  await page.getByRole("button", { name: "Add Beta Studio to favorites" }).click();
  await expect(page.getByRole("button", { name: "Remove Beta Studio from favorites" })).toBeVisible();

  // Before the restore the row and the project already agree.
  await expect
    .poll(async () => {
      const { project, summary } = await rows(page);
      return [summary.name, summary.tags, summary.favorite, project.snapshot.brand.profile.name];
    })
    .toEqual(["Beta Studio", ["client"], true, "Beta Studio"]);

  // Restore the Alpha version from the history.
  await page.getByRole("button", { name: "History of Beta Studio" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("list", { name: "Versions" }).getByRole("button")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText(/^Restored the version from/)).toBeVisible();
  // The restored brand is written to the saved settings a moment later.
  await saved(page, "designhub:brand", '"name":"Alpha"');
  await expect(page.getByRole("heading", { name: "Alpha", level: 2 })).toBeVisible();

  // The restore changed the name back and kept the tag and the favorite, in the project and in its row alike.
  const { project, summary } = await rows(page);
  expect(project.snapshot.brand.profile.name).toBe("Alpha");
  expect(project.tags).toEqual(["client"]);
  expect(project.favorite).toBe(true);
  expect(summary).toEqual({
    id: project.id,
    name: project.snapshot.brand.profile.name,
    tags: project.tags,
    favorite: project.favorite,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastOpenedAt: project.lastOpenedAt,
  });

  // After a reload the list still shows what the row says.
  await page.reload();
  await hydrated(page);
  await expect(page.getByRole("button", { name: "Alpha (open)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove tag client from Alpha" })).toBeVisible();
});
