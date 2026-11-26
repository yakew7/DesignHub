import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { readTable } from "./indexeddb";
import { confirmImport, hydrated, saved } from "./storage";

type Entry = {
  id?: string;
  favorite: boolean;
  tags: string[];
  snapshot: { brand: { profile: { name: string } } };
  history: { createdAt: number; reason: string; snapshot: unknown }[];
};
type Project = {
  id: string;
  tags: string[];
  favorite: boolean;
  updatedAt: number;
  snapshot: { brand: { profile: { name: string } } };
};
type Summary = { id: string; name: string; tags: string[]; favorite: boolean; updatedAt: number; bytes: number };
type Version = { id: string; projectId: string; createdAt: number; reason: string; snapshot?: Project["snapshot"] };

const names = ["Replace Alpha", "Replace Beta", "Replace Gamma"];
const fileTags = [["client"], ["from-file"], []];

/** A project file of three projects, each with two saved versions, written to disk. */
function writeProjectFile(): string {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  expect(template.history.length).toBeGreaterThanOrEqual(2);
  fixture.projects = names.map((name, index) => {
    const copy = structuredClone(template);
    copy.tags = fileTags[index] ?? [];
    copy.favorite = false;
    copy.snapshot.brand.profile.name = name;
    copy.history = copy.history.slice(0, 2);
    return copy;
  });
  const file = test.info().outputPath("replace-source.json");
  writeFileSync(file, JSON.stringify(fixture));
  return file;
}

const projects = (page: Page) => readTable<Project>(page, "projects");
const projectNamed = async (page: Page, name: string) =>
  (await projects(page)).find((project) => project.snapshot.brand.profile.name === name);

/** The same project file after it was archived: it carries each project's id, Gamma's is removed, and a new one is added. */
function writeReimportFile(archive: string): string {
  const file = JSON.parse(readFileSync(archive, "utf8")) as { projects: Entry[] };
  const gamma = file.projects.find((entry) => entry.snapshot.brand.profile.name === "Replace Gamma");
  expect(file.projects.every((entry) => typeof entry.id === "string")).toBe(true);
  // A file from before ids: Gamma is still recognised, as an identical copy.
  delete gamma?.id;
  const delta = structuredClone(file.projects[0]!);
  delete delta.id;
  delta.snapshot.brand.profile.name = "Replace Delta";
  file.projects.push(delta);
  const out = test.info().outputPath("replace-again.json");
  writeFileSync(out, JSON.stringify(file));
  return out;
}

async function importThree(page: Page) {
  await page.goto("/projects");
  await hydrated(page);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(writeProjectFile());
  await confirmImport(page);
  for (const name of names) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
}

/** Archives the three projects and undoes it, so the browser holds them again with the ids the archive carries. Returns the archive. */
async function archiveAndUndo(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Select", exact: true }).click();
  for (const name of names) await page.getByRole("checkbox", { name: `Select ${name}` }).check();
  const download = page.waitForEvent("download");
  await page
    .getByRole("region", { name: "Actions for the selected projects" })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  const archive = await (await download).path();
  await expect(page.getByText("Archived 3 projects to a file")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Restored 3 projects")).toBeVisible();
  for (const name of names) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  return archive;
}

const radio = (dialog: Locator, name: string, choice: "Skip" | "Replace") =>
  dialog.getByRole("group", { name: `What to do with ${name}` }).getByRole("radio", { name: choice });

test("re-importing an archive marks the projects already here; skip leaves one alone, replace writes the file's copy and keeps the old state as a version", async ({
  page,
}) => {
  await importThree(page);
  const archive = await archiveAndUndo(page);

  // Edit Beta here after the archive was made: its name and its tags now differ from the file's copy.
  await page.getByRole("button", { name: "Rename Replace Beta" }).click();
  await page.getByLabel("Project name").fill("Replace Beta edited");
  await page.getByLabel("Project name").press("Enter");
  await expect(page.getByRole("heading", { name: "Replace Beta edited", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Add a tag to Replace Beta edited" }).click();
  await page.getByLabel("New tag for Replace Beta edited").fill("local");
  await page.getByLabel("New tag for Replace Beta edited").press("Enter");
  await expect(page.getByRole("button", { name: "Remove tag local from Replace Beta edited" })).toBeVisible();

  const alphaBefore = await projectNamed(page, "Replace Alpha");
  const betaBefore = await projectNamed(page, "Replace Beta edited");
  const gammaBefore = await projectNamed(page, "Replace Gamma");
  expect(betaBefore?.tags).toEqual(["from-file", "local"]);
  const versionsBefore = await readTable<Version>(page, "versions");
  const countOf = (all: Version[], id: string | undefined) => all.filter((version) => version.projectId === id).length;

  // The file has Alpha and Beta with their ids, Gamma with none (an older file), and a new project.
  await page.locator('input[type="file"]').first().setInputFiles(writeReimportFile(archive));
  const dialog = page.getByRole("dialog", { name: "Choose what to import" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Already here")).toHaveCount(3);
  await expect(dialog.getByRole("checkbox")).toHaveCount(1);
  await expect(dialog.getByRole("checkbox", { name: /^Replace Delta/ })).toBeChecked();
  for (const name of names) await expect(radio(dialog, name, "Skip")).toBeChecked();
  await expect(radio(dialog, "Replace Beta", "Replace")).not.toBeChecked();

  // Skipped rows import nothing: with the new project unchecked the import is empty.
  await dialog.getByRole("button", { name: "Select none" }).click();
  await expect(dialog.getByRole("button", { name: "Import 0 projects" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Select all" }).click();
  await radio(dialog, "Replace Beta", "Replace").check();
  await expect(dialog.getByRole("button", { name: "Import 2 projects" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Import 2 projects" }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByText("Replaced 1 project")).toBeVisible();
  await expect(page.getByText("Imported 1 project")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Replace Beta", level: 2, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Replace Delta", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Replace Beta edited", level: 2 })).toHaveCount(0);

  // Nothing was added again with "(2)", and Alpha and Gamma are exactly as they were.
  const after = await projects(page);
  expect(after.filter((project) => project.snapshot.brand.profile.name.includes("(2)"))).toEqual([]);
  expect(await projectNamed(page, "Replace Alpha")).toEqual(alphaBefore);
  expect(await projectNamed(page, "Replace Gamma")).toEqual(gammaBefore);
  expect(after.filter((project) => project.snapshot.brand.profile.name.startsWith("Replace "))).toHaveLength(4);

  // Beta is the file's copy under the same id, with the file's tags, and its old state is a new version.
  const beta = await projectNamed(page, "Replace Beta");
  expect(beta?.id).toBe(betaBefore?.id);
  expect(beta?.tags).toEqual(["from-file"]);
  const versionsAfter = await readTable<Version>(page, "versions");
  expect(countOf(versionsAfter, beta?.id)).toBe(countOf(versionsBefore, beta?.id) + 1);
  const added = versionsAfter.filter(
    (version) => version.projectId === beta?.id && !versionsBefore.some((old) => old.id === version.id),
  );
  expect(added).toHaveLength(1);
  expect(added[0]?.reason).toBe("import");
  expect(added[0]?.snapshot?.brand.profile.name).toBe("Replace Beta edited");
  // The skipped projects gained no version.
  expect(countOf(versionsAfter, alphaBefore?.id)).toBe(countOf(versionsBefore, alphaBefore?.id));
  expect(countOf(versionsAfter, gammaBefore?.id)).toBe(countOf(versionsBefore, gammaBefore?.id));

  // Every summary row agrees with its project, and the replaced one shows the file's name and tags.
  const summaries = await readTable<Summary>(page, "summaries");
  expect(summaries).toHaveLength(after.length);
  for (const project of after) {
    const row = summaries.find((item) => item.id === project.id);
    expect(row, project.snapshot.brand.profile.name).toMatchObject({
      name: project.snapshot.brand.profile.name,
      tags: project.tags,
      favorite: project.favorite,
      updatedAt: project.updatedAt,
      bytes: new TextEncoder().encode(JSON.stringify(project)).length,
    });
  }
  await expect(page.getByRole("button", { name: "Remove tag from-file from Replace Beta" })).toBeVisible();

  // The replaced project's old state is in its history.
  await page.getByRole("button", { name: "History of Replace Beta" }).click();
  await expect(page.getByRole("dialog").getByText("Before replacing from a file")).toBeVisible();
});

test("replacing the open project saves what is on screen first, and the open project then shows the file's copy", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
  await page.goto("/brand");
  await hydrated(page);
  await page.getByLabel("Brand name").fill("Typed Acme");
  await saved(page, "designhub:brand", "Typed Acme");
  await page.goto("/projects");
  await hydrated(page);
  await expect(page.getByRole("button", { name: "Typed Acme (open)" })).toBeVisible();

  const [open] = await projects(page);
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const entry = structuredClone(fixture.projects[0]) as Entry;
  entry.id = open?.id;
  entry.tags = ["from-file"];
  entry.history = [];
  entry.snapshot.brand.profile.name = "Brand from file";
  const file = test.info().outputPath("replace-open.json");
  writeFileSync(file, JSON.stringify({ ...fixture, projects: [entry] }));

  // One project, but it is already here, so the preview asks instead of importing in one step.
  await page.locator('input[type="file"]').first().setInputFiles(file);
  const dialog = page.getByRole("dialog", { name: "Choose what to import" });
  await expect(dialog.getByText("Already here")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Import 0 projects" })).toBeDisabled();
  await radio(dialog, "Brand from file", "Replace").check();
  await dialog.getByRole("button", { name: "Import 1 project", exact: true }).click();
  await expect(page.getByText("Replaced 1 project")).toBeVisible();
  await expect(page.getByRole("button", { name: "Brand from file (open)" })).toBeVisible();
  await saved(page, "designhub:brand", "Brand from file");

  const versions = await readTable<Version>(page, "versions");
  const kept = versions.filter((version) => version.projectId === open?.id && version.reason === "import");
  expect(kept).toHaveLength(1);
  expect(kept[0]?.snapshot?.brand.profile.name).toBe("Typed Acme");
  const stored = await projects(page);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ id: open?.id, tags: ["from-file"] });
  expect(stored[0]?.snapshot.brand.profile.name).toBe("Brand from file");
  const [row] = await readTable<Summary>(page, "summaries");
  expect(row).toMatchObject({ id: open?.id, name: "Brand from file", tags: ["from-file"] });
});

test("the import preview with a marked row passes the axe scan in light and dark", async ({ page }) => {
  await importThree(page);
  const archive = await archiveAndUndo(page);
  await page.locator('input[type="file"]').first().setInputFiles(writeReimportFile(archive));
  const dialog = page.getByRole("dialog", { name: "Choose what to import" });
  await expect(dialog.getByText("Already here")).toHaveCount(3);
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
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
