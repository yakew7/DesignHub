import { expect, test, type Page } from "@playwright/test";

/** Waits until the saved Export Engine settings hold this format, so a reload cannot beat the write. */
async function saved(page: Page, id: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (wanted) =>
          new Promise<boolean>((resolve) => {
            const open = indexedDB.open("designhub");
            open.onerror = () => resolve(false);
            open.onsuccess = () => {
              const request = open.result.transaction("kv").objectStore("kv").get("designhub:tokens");
              request.onsuccess = () =>
                resolve(String(request.result?.value ?? "").includes(`"openFormat":"${wanted}"`));
              request.onerror = () => resolve(false);
            };
          }),
        id,
      ),
    )
    .toBe(true);
}

test("a link opens a format, a reload keeps the one that was open, and an unknown id changes nothing", async ({
  page,
}) => {
  await page.goto("/export?format=tailwind-v4");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  await saved(page, "tailwind-v4");
  // The choice survives a reload with no query.
  await page.goto("/export");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  // Another format, picked by hand, is remembered instead.
  await page.getByRole("radio", { name: "CSS variables", exact: true }).first().click();
  await saved(page, "css");
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
  await page.getByRole("radio", { name: "Tailwind v4" }).first().click();
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
