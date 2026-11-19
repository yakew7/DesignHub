import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { hydrated } from "./hydrated";
import { createVersionFiveDatabase, databaseShape, readTable, type VersionFiveRows } from "./indexeddb";

type Project = { id: string; favorite: boolean; tags: string[]; snapshot: { brand: { profile: { name: string } } } };
type Summary = { id: string; name: string; favorite: boolean; tags: string[] };
type Row = { id?: string; key?: string };

const fixture: VersionFiveRows = JSON.parse(
  readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v5/designhub-v5.json"), "utf8"),
);
const projects = fixture.projects as Project[];
const [, brand, second, coffee] = projects;
const ids = (rows: Row[]) => rows.map((row) => row.id ?? row.key).sort();

test("a database saved at version 5 opens at version 6 with every table and row, and the list and history show them", async ({
  page,
}) => {
  await createVersionFiveDatabase(page, fixture);
  // It is a version 5 database for real: no summaries table yet.
  const before = await databaseShape(page);
  expect(before.version).toBe(50);
  expect(before.tables).toEqual(["handles", "icons", "kv", "projects", "versions"]);

  await page.goto("/projects");
  await hydrated(page);

  // Every project is in the list, under its own name.
  await expect(page.getByRole("button", { name: "Open Second Fixture" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Harbour Coffee" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Acme (open)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Fixture Brand" })).toBeVisible();

  // Its tags are on the cards, and the favorite is still marked.
  for (const project of [brand, second, coffee]) {
    const name = project.snapshot.brand.profile.name;
    const chips = page.getByRole("list", { name: `Tags for ${name}` }).getByRole("button", { name: /^Remove tag / });
    await expect(chips).toHaveCount(project.tags.length);
    for (const tag of project.tags) {
      await expect(page.getByRole("button", { name: `Remove tag ${tag} from ${name}` })).toBeVisible();
    }
  }
  await expect(page.getByRole("button", { name: "Remove Fixture Brand from favorites" })).toBeVisible();

  // The upgrade kept every table of version 5 and added the summaries table (the list fills it once it has opened).
  await expect
    .poll(async () => (await readTable<Summary>(page, "summaries")).length, { message: "summary rows" })
    .toBe(projects.length);
  expect(await databaseShape(page)).toEqual({
    version: 60,
    tables: ["handles", "icons", "kv", "projects", "summaries", "versions"],
  });

  // Not one row was lost or rewritten as something else: the same projects, with the same tags and favorite.
  const stored = await readTable<Project>(page, "projects");
  expect(ids(stored)).toEqual(ids(projects));
  for (const project of projects) {
    const row = stored.find((item) => item.id === project.id);
    expect(row?.tags, project.snapshot.brand.profile.name).toEqual(project.tags);
    expect(row?.favorite, project.snapshot.brand.profile.name).toBe(project.favorite);
    expect(row?.snapshot.brand.profile.name).toBe(project.snapshot.brand.profile.name);
  }
  expect(ids(await readTable<Row>(page, "versions"))).toEqual(ids(fixture.versions));
  expect(ids(await readTable<Row>(page, "icons"))).toEqual(ids(fixture.icons));
  const keys = (await readTable<Row>(page, "kv")).map((row) => row.key);
  for (const row of fixture.kv as Row[]) expect(keys).toContain(row.key);

  // Each project has a summary row with its own name, tags and favorite.
  const summaries = await readTable<Summary>(page, "summaries");
  expect(ids(summaries)).toEqual(ids(projects));
  for (const project of projects) {
    expect(summaries.find((item) => item.id === project.id)).toMatchObject({
      name: project.snapshot.brand.profile.name,
      tags: project.tags,
      favorite: project.favorite,
    });
  }

  // The history of a project lists its versions, newest first, and each opens with its own brand.
  await page.getByRole("button", { name: `History of ${brand.snapshot.brand.profile.name}` }).click();
  const dialog = page.getByRole("dialog");
  const versions = dialog.getByRole("list", { name: "Versions" }).getByRole("button");
  await expect(versions).toHaveCount(2);
  const preview = dialog.getByRole("region", { name: "Version preview" });
  await expect(preview).toContainText("Fixture Brand (older)");
  await versions.last().click();
  await expect(preview).toContainText("Fixture Brand (oldest)");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: `History of ${coffee.snapshot.brand.profile.name}` }).click();
  await expect(dialog.getByRole("list", { name: "Versions" }).getByRole("button")).toHaveCount(1);
  await expect(dialog.getByRole("region", { name: "Version preview" })).toContainText("Harbour Coffee Roasters");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // A project with no versions says so.
  await page.getByRole("button", { name: `History of ${second.snapshot.brand.profile.name}` }).click();
  await expect(dialog).toContainText("No versions yet.");
});
