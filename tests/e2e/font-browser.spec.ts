import { expect, test } from "@playwright/test";

import { expectUnder } from "./timing";

test("the whole catalog is listed, but only the rows near the view are in the page", async ({ page }, testInfo) => {
  await page.goto("/typography");
  const list = page.getByRole("listbox", { name: "Fonts" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option").first()).toBeVisible();

  await page.evaluate(() => {
    const longTasks: number[] = [];
    Object.assign(window, { longTasks });
    new PerformanceObserver((entries) =>
      entries.getEntries().forEach((entry) => longTasks.push(entry.duration)),
    ).observe({
      type: "longtask",
    });
  });

  // End jumps to the last of the catalog; Page Down and Page Up then move a screen at a time.
  await list.focus();
  await page.keyboard.press("End");
  const last = list.getByRole("option").last();
  await expect(last).toHaveAttribute("aria-posinset", /^\d+$/);
  const total = Number(await last.getAttribute("aria-setsize"));
  expect(total).toBeGreaterThan(500);
  await expect(last).toHaveAttribute("aria-posinset", String(total));
  for (let step = 0; step < 15; step += 1) await page.keyboard.press("PageUp");
  for (let step = 0; step < 15; step += 1) await page.keyboard.press("PageDown");

  // With the whole catalog showing, only about a screenful of rows is in the page.
  expect(await list.getByRole("option").count()).toBeLessThanOrEqual(60);

  const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
  // The target is 50 ms; the bound leaves room for a busy CI machine.
  await expectUnder(testInfo, "longest-task", longest, 300);
});

test("announces the filtered font count after search input settles", async ({ page }) => {
  await page.goto("/typography");
  const search = page.getByRole("searchbox", { name: "Search fonts" });
  const announcement = page.locator('[aria-live="polite"][aria-atomic="true"]');
  await expect(announcement).toHaveText(/\d+ fonts?/);

  await search.fill("open sans");
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(announcement).toHaveText("1 font");
});
