import { expect, test } from "@playwright/test";

import { saved } from "./storage";

test("the Brand page opens the essentials, folds the rest and remembers the choice", async ({ page }) => {
  await page.goto("/brand");
  await expect(page.locator("h1").first()).toBeVisible();

  const toggle = (name: string) => page.getByRole("button", { name, exact: true });
  for (const name of ["Identity", "Colors", "Typography"]) {
    await expect(toggle(name)).toHaveAttribute("aria-expanded", "true");
  }
  // At most four panels are open on a new project, and shape and links are folded.
  await expect(toggle("Shape & depth")).toHaveAttribute("aria-expanded", "false");
  await expect(toggle("Connected studios")).toHaveAttribute("aria-expanded", "false");
  expect(await page.locator('main button[aria-expanded="true"]').filter({ hasText: /./ }).count()).toBeLessThanOrEqual(
    4,
  );

  // A folded panel holds its controls back; opening it brings them, and the choice survives a reload.
  await expect(page.getByText("Border radius")).toBeHidden();
  await toggle("Shape & depth").click();
  await expect(page.getByText("Border radius")).toBeVisible();
  await saved(page, "designhub:panels", "brand-shape");
  await page.reload();
  await expect(toggle("Shape & depth")).toHaveAttribute("aria-expanded", "true");
});
