import { expect, test } from "@playwright/test";

import { saved } from "./storage";

test("a first visit shows no continue link, but returning from a studio links back to it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What do you want to make?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue in/ })).toHaveCount(0);

  await page.goto("/colors");
  await saved(page, "designhub:nav", "colors");

  await page.goto("/");
  const continueLink = page.getByRole("link", { name: "Continue in the Color Studio" });
  await expect(continueLink).toBeVisible();
  await continueLink.click();
  await expect(page).toHaveURL(/\/colors$/);
});

test("the home page asks what to make, links each goal, and keeps every studio one click away", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What do you want to make?" })).toBeVisible();

  const goals = page.getByRole("region", { name: "What do you want to make?" }).getByRole("link");
  expect(await goals.count()).toBe(8);
  for (const href of await goals.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    const response = await page.request.get(href!);
    expect(response.status(), href!).toBe(200);
  }

  // The full list is folded, and opens with the keyboard.
  const all = page.locator("summary", { hasText: /All \d+ studios/ });
  await expect(page.getByRole("link", { name: /Export Engine/ }).first()).toBeAttached();
  await all.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details[open]")).toHaveCount(1);
  await page
    .getByRole("link", { name: /Accessibility Lab/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/accessibility$/);
});

test("only the active language's messages are downloaded", async ({ page }) => {
  const bodies: string[] = [];
  page.on("response", async (response) => {
    if (!response.url().includes("/_next/static/chunks/")) return;
    bodies.push(await response.text().catch(() => ""));
  });
  const SPANISH = "Estudio de marca";
  const FRENCH = "Studio de marque";

  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(bodies.some((body) => body.includes(SPANISH))).toBe(false);
  expect(bodies.some((body) => body.includes(FRENCH))).toBe(false);

  await page.evaluate(() => window.localStorage.setItem("designhub:locale", "es"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect.poll(() => bodies.some((body) => body.includes(SPANISH))).toBe(true);
  expect(bodies.some((body) => body.includes(FRENCH))).toBe(false);
});

test("the studio chooser is one tab stop and the arrow keys move across it", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  const goals = page.locator("a[data-goal]");
  const count = await goals.count();
  expect(count).toBeGreaterThan(3);
  expect(await page.locator('a[data-goal][tabindex="0"]').count()).toBe(1);

  const focusedGoal = () => page.evaluate(() => document.activeElement?.getAttribute("data-goal") ?? "");
  await goals.first().focus();
  const first = await focusedGoal();
  await page.keyboard.press("ArrowRight");
  const second = await focusedGoal();
  expect(second).not.toBe(first);
  await page.keyboard.press("ArrowLeft");
  expect(await focusedGoal()).toBe(first);
  await page.keyboard.press("End");
  expect(await focusedGoal()).toBe(await goals.last().getAttribute("data-goal"));
  await page.keyboard.press("Home");
  expect(await focusedGoal()).toBe(first);
  // A move past the start stays put, and Enter opens the goal like any link.
  await page.keyboard.press("ArrowLeft");
  expect(await focusedGoal()).toBe(first);
  await page.keyboard.press("ArrowDown");
  const below = await focusedGoal();
  expect(below).not.toBe(first);
  await page.keyboard.press("ArrowUp");
  expect(await focusedGoal()).toBe(first);
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/\/$/, { timeout: 20_000 });
});
