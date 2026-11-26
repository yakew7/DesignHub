import { expect, test } from "@playwright/test";

import { hydrated } from "./storage";

// The header's More menu is loaded on first use, so Radix's menu is not in the first load of the home page.
test.use({ viewport: { width: 1100, height: 800 } });

test("the More menu opens with a click, lists the other studios and goes to one", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const more = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "More" });
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const items = menu.getByRole("menuitem");
  expect(await items.count()).toBeGreaterThan(0);
  await items.first().click();
  await expect(page).not.toHaveURL(/localhost:\d+\/$/);
});

test("the More menu opens from the keyboard, closes with Escape and returns focus to its button", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const more = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "More" });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(more).toBeFocused();
});

test("the home page does not download the menu's code until the button is used", async ({ page }) => {
  const scripts: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/_next/static/chunks/") && response.url().endsWith(".js"))
      scripts.push(response.url());
  });
  await page.goto("/");
  await hydrated(page);
  await page.waitForLoadState("networkidle");
  const before = scripts.length;
  const more = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "More" });
  await more.hover();
  await more.click();
  await expect(page.getByRole("menu")).toBeVisible();
  // At least one script (the menu's own chunk) came after the first load.
  expect(scripts.length).toBeGreaterThan(before);
});
