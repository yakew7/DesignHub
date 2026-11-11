import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { expectUnder } from "./timing";

type Entry = { favorite: boolean; tags: string[]; snapshot: { brand: { profile: { name: string } } } };

test("a hundred and fifty projects draw thirty cards first, search by name and tag, and draw more as you scroll", async ({
  page,
}, testInfo) => {
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  fixture.projects = Array.from({ length: 150 }, (_, index) => {
    const copy = structuredClone(template);
    copy.favorite = false;
    copy.tags = [index % 10 === 0 ? "archived" : "active"];
    copy.snapshot.brand.profile.name = `Brand ${String(index).padStart(3, "0")}`;
    return copy;
  });
  const file = join(tmpdir(), "designhub-many-projects.json");
  writeFileSync(file, JSON.stringify(fixture));

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  const started = Date.now();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  const cards = page.getByRole("button", { name: /^Open Brand \d+$/ });
  await expect(cards.first()).toBeVisible();
  // Newest first, so the last imported is on top; the first page is a screenful, not all hundred and fifty.
  await expect(page.getByRole("button", { name: "Open Brand 149" })).toBeVisible();
  expect(await cards.count()).toBeLessThanOrEqual(36);
  // The list is drawn from the small summary rows: after a reload, only the open project and the cards near the view
  // are read whole, not all hundred and fifty.
  await page.reload();
  await expect(page.getByRole("button", { name: /^Open Brand \d+$/ }).first()).toBeVisible();
  await expect(page.locator('[data-preview="drawn"]').first()).toBeVisible();
  const reads = await page.evaluate(() =>
    (window as unknown as { __designhubProjectReads: () => number }).__designhubProjectReads(),
  );
  expect(reads, "whole projects read for the list").toBeLessThan(60);
  // Only the cards within a screen of the view draw their picture; the others wait until they come near.
  const drawn = page.locator('[data-preview="drawn"]');
  await expect(drawn.first()).toBeVisible();
  const drawnCount = await drawn.count();
  expect(drawnCount).toBeGreaterThan(0);
  expect(drawnCount).toBeLessThan(await cards.count());
  expect(await page.locator('[data-preview="waiting"]').count()).toBeGreaterThan(0);
  await expectUnder(testInfo, "import-ms", Date.now() - started, 10_000);

  // A search matches the name or a tag, and covers the whole list, not only what is drawn.
  const search = page.getByLabel("Search projects");
  await search.fill("brand 000");
  await expect(page.getByRole("button", { name: "Open Brand 000" })).toBeVisible();
  await search.fill("archived");
  await expect(page.getByRole("button", { name: "Open Brand 140" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Brand 141" })).toHaveCount(0);
  await search.fill("");

  // More are drawn when the end of the list comes into view, or with the button.
  await page.getByRole("button", { name: /^Show \d+ more$/ }).scrollIntoViewIfNeeded();
  await expect.poll(async () => await cards.count()).toBeGreaterThan(30);
});
