import { expect, test } from "@playwright/test";
import { saved } from "./storage";

test("an older version is rebuilt from the stored changes and restores the brand as it was", async ({ page }) => {
  // A first visit to Brand Projects creates the project that versions belong to.
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
  await page.goto("/brand");
  await expect(page.locator("h1").first()).toBeVisible();
  const name = page.getByLabel("Brand name");

  // Each Surprise me keeps the state before it as a version: three states, so two are stored as changes.
  for (const brand of ["Alpha", "Beta", "Gamma"]) {
    await name.fill(brand);
    await expect(name).toHaveValue(brand);
    await page.getByRole("button", { name: "Surprise me" }).click();
    // The version is written a moment after the click; give the write time before the next state.
    await page.waitForTimeout(400);
  }
  await name.fill("Delta");

  await page.goto("/projects");
  await page
    .getByRole("button", { name: /^History of / })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const versions = dialog.getByRole("list").getByRole("button");
  await expect.poll(async () => await versions.count()).toBeGreaterThanOrEqual(3);

  // Stored form: the newest version is whole and the older ones are changes from the version after them.
  const forms = await page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const open = indexedDB.open("designhub");
        open.onsuccess = () => {
          const request = open.result.transaction("versions").objectStore("versions").getAll();
          request.onsuccess = () =>
            resolve((request.result as object[]).map((row) => ("snapshot" in row ? "whole" : "delta")));
        };
      }),
  );
  expect(forms.filter((form) => form === "whole")).toHaveLength(1);
  expect(forms.filter((form) => form === "delta").length).toBeGreaterThanOrEqual(2);

  // The oldest version is the Alpha state; opening it rebuilds it from the chain of changes.
  await versions.last().click();
  await dialog.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText(/^Restored the version from/)).toBeVisible();
  // The restored brand is written a moment later; wait for it before leaving the page.
  await saved(page, "designhub:brand", "Alpha");
  await page.goto("/brand");
  await expect(page.getByLabel("Brand name")).toHaveValue("Alpha");
});
