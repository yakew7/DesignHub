import { expect, test } from "@playwright/test";

import { saved } from "./storage";

test("a link opens a format, a reload keeps the one that was open, and an unknown id changes nothing", async ({
  page,
}) => {
  await page.goto("/export?format=tailwind-v4");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  await saved(page, "designhub:tokens", '"openFormat":"tailwind-v4"');
  // The choice survives a reload with no query.
  await page.goto("/export");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  // Another format, picked by hand, is remembered instead.
  await page.getByRole("radio", { name: "CSS variables", exact: true }).first().click();
  await saved(page, "designhub:tokens", '"openFormat":"css"');
  await page.goto("/export");
  await expect(page.getByRole("radio", { name: "CSS variables", exact: true }).first()).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // An id that is not a format leaves the open one and shows no error.
  await page.goto("/export?format=nope");
  await expect(page.getByRole("radio", { name: "CSS variables", exact: true }).first()).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("the copied link opens the format that was open", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/export");
  await expect(page.getByRole("button", { name: "Copy link to this format" })).toBeVisible();
  const tailwindRadio = page.getByRole("radio", { name: "Tailwind v4" }).first();
  await tailwindRadio.click();
  await expect(tailwindRadio).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Copy link to this format" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).pathname + new URL(link).search).toBe("/export?format=tailwind-v4");

  // Another person opens it: a new page with nothing saved lands on the same format.
  const other = await context.browser()!.newContext();
  const page2 = await other.newPage();
  await page2.goto(link);
  await expect(page2.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");
  await other.close();
});
