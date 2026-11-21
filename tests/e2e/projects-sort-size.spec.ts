import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type Entry = { favorite: boolean; tags: string[]; snapshot: { brand: { profile: { name: string } } } };

test("sorting by size puts the largest project first and shows a size on each card", async ({ page }) => {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  // The size is the bytes of the stored snapshot, so longer names make larger projects.
  fixture.projects = ["Small", "Medium Brand Name", `Biggy ${"x".repeat(300)}`].map((name) => {
    const copy = structuredClone(template);
    copy.favorite = false;
    copy.tags = [];
    copy.snapshot.brand.profile.name = name;
    return copy;
  });
  const file = join(tmpdir(), "designhub-size-sort-projects.json");
  writeFileSync(file, JSON.stringify(fixture));

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(page.getByRole("button", { name: "Open Small" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Medium Brand Name" })).toBeVisible();

  // Each card shows its size, from the summary row, without reading the whole project.
  await expect(page.getByText(/^Size \d+(\.\d+)? (B|KB|MB)$/).first()).toBeVisible();

  await page.getByLabel("Sort projects").click();
  await page.getByRole("option", { name: "Largest first" }).click();

  const cards = page.getByRole("button", { name: /^Open / });
  const names = await cards.allTextContents();
  const at = (text: string) => names.findIndex((name) => name.includes(text));
  expect(at("Biggy")).toBeGreaterThanOrEqual(0);
  expect(at("Medium Brand Name")).toBeGreaterThanOrEqual(0);
  expect(at("Small")).toBeGreaterThanOrEqual(0);
  expect(at("Biggy")).toBeLessThan(at("Medium Brand Name"));
  expect(at("Medium Brand Name")).toBeLessThan(at("Small"));
});
