import { expect, test } from "@playwright/test";

import { hydrated } from "./storage";

test("variable-axis animation respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/typography");
  await expect(page.locator("h1").first()).toBeVisible();
  await hydrated(page);

  await page.getByRole("radio", { name: "Advanced" }).click();
  await page.getByRole("switch", { name: "Variable only" }).click();
  await page.getByLabel("Search fonts").fill("Comfortaa");
  const fonts = page.getByRole("listbox");
  await fonts.locator(".cursor-pointer").first().click();
  await expect(page.getByText("Variable axes", { exact: true })).toBeVisible();

  const animate = page.locator("#typography-variable button").last();
  await expect(animate).toBeVisible();
  await animate.evaluate((element) => (element as HTMLButtonElement).click());

  await expect(animate).toHaveAttribute("aria-pressed", "false");
  await expect(animate).toHaveAccessibleName("Animate Weight");
});
