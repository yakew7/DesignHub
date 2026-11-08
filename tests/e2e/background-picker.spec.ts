import { expect, test } from "@playwright/test";

import { expectUnder, pageSpeed } from "./timing";

test("the generator picker is grouped, searchable, and finds a merged look by its old name", async ({ page }) => {
  await page.goto("/backgrounds");
  await expect(page.locator("h1").first()).toBeVisible();
  const picker = page.getByRole("group", { name: "Generator" });

  // The group of the selected generator is open: a handful of buttons, not all 33.
  expect(await picker.getByRole("radio").count()).toBeLessThanOrEqual(9);

  // Open another group and pick from it.
  await picker.getByRole("button", { name: /^Textures/ }).click();
  await picker.getByRole("radio", { name: "Noise" }).click();
  await expect(picker.getByRole("radio", { name: "Noise" })).toHaveAttribute("aria-checked", "true");

  // A search for an old name finds the merged generator that now holds that look.
  const search = page.getByRole("searchbox", { name: "Find a generator" });
  await search.fill("plaid");
  await expect(picker.getByRole("radio", { name: "Woven" })).toBeVisible();
  await picker.getByRole("radio", { name: "Woven" }).click();
  await expect(page.getByRole("radiogroup", { name: "Woven look" })).toBeVisible();

  await search.fill("zzzz");
  await expect(page.getByText("No generator matches that search.")).toBeVisible();
});

test("dragging a slider on a heavy generator does not block the page for long", async ({ page }, testInfo) => {
  await page.goto("/backgrounds");
  await expect(page.locator("h1").first()).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Find a generator" });
  await search.fill("flow");
  await page.getByRole("group", { name: "Generator" }).getByRole("radio", { name: /Flow/ }).click();
  const slider = page.getByRole("slider", { name: "Density", exact: true });
  await expect(slider).toBeVisible();
  const preview = page.locator('img[src^="data:image/svg+xml"]').first();
  await expect(preview).toBeVisible();

  // Measured in the browser: every task on the main thread longer than 50 ms ("long task"), over a held-down
  // drag of the slider with the keyboard, which sends a new setting on every key repeat.
  await page.evaluate(() => {
    const longest: number[] = [];
    Object.assign(window, { longTasks: longest });
    new PerformanceObserver((list) => list.getEntries().forEach((entry) => longest.push(entry.duration))).observe({
      type: "longtask",
      buffered: false,
    });
  });
  const before = await preview.getAttribute("src");
  await slider.focus();
  for (let step = 0; step < 30; step += 1) await page.keyboard.press("ArrowRight");
  await expect.poll(async () => await preview.getAttribute("src")).not.toBe(before);

  const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
  // The drawing really happened in a worker, not on the page.
  expect(page.workers().length).toBeGreaterThan(0);
  // The target is 50 ms; the bound leaves room for a busy CI machine.
  await expectUnder(testInfo, "longest-task", longest, 300);
});

test("the isometric generator, the slowest at a large canvas, is drawn in the worker without blocking input", async ({
  page,
}, testInfo) => {
  await page.goto("/backgrounds");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("searchbox", { name: "Find a generator" }).fill("isometric");
  await page
    .getByRole("group", { name: "Generator" })
    .getByRole("radio", { name: /Isometric/ })
    .click();
  const slider = page.getByRole("slider", { name: "Density", exact: true });
  await expect(slider).toBeVisible();
  await page.getByRole("combobox", { name: "Canvas size" }).click();
  await page.getByRole("option", { name: /Full HD/ }).click();
  const speed = await pageSpeed(page);
  await page.evaluate(() => {
    const longTasks: number[] = [];
    Object.assign(window, { longTasks });
    new PerformanceObserver((entries) =>
      entries.getEntries().forEach((entry) => longTasks.push(entry.duration)),
    ).observe({
      type: "longtask",
    });
  });

  await slider.focus();
  await page.keyboard.press("End");
  for (let step = 0; step < 10; step += 1) await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "90");
  expect(page.workers().length).toBeGreaterThan(0);
  // No "Drawing…" note is left behind once the last drawing has arrived.
  await expect(page.getByRole("status").filter({ hasText: "Drawing" })).toHaveCount(0, { timeout: 30_000 });
  const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
  // The drawing is in the worker (checked above). The longest task is compared with how long a fixed piece of work takes
  // in this page, so a busy machine moves both. Inline, this drawing alone took several times that work.
  await testInfo.attach("page-speed", { body: String(Math.round(speed)), contentType: "text/plain" });
  await expectUnder(testInfo, "longest-task-vs-speed", longest / speed, 15);
});
