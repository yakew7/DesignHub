import { expect, test } from "@playwright/test";

import { hydrated } from "./storage";

/**
 * Choosing a language says its own name in a polite live region, once, when the language's core messages have
 * loaded, and keeps the document's `lang` the language of the text.
 */
test("switching language announces the new language's name once and keeps lang correct", async ({ page }) => {
  await page.goto("/colors");
  await hydrated(page);
  const announcement = page.getByTestId("language-announcement");
  await expect(announcement).toHaveAttribute("role", "status");
  await expect(announcement).toHaveAttribute("aria-live", "polite");
  // Opening a page is not a change of language, so nothing is said yet.
  await expect(announcement).toHaveText("");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  // Record what the region says, so a second announcement (for a studio part that loads after the core) would show.
  await announcement.evaluate((element) => {
    const said: string[] = [];
    Object.assign(window, { said });
    new MutationObserver(() => said.push(element.textContent ?? "")).observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });

  // Found by its options, because its label changes with the language.
  const switcher = page
    .locator("select")
    .filter({ has: page.locator('option[value="hi"]') })
    .first();
  await switcher.selectOption("es");
  await expect(announcement).toHaveText("Español");
  await expect(announcement).toHaveAttribute("lang", "es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  // The Color Studio's own Spanish messages arrive after the core. Wait for them, then check nothing more was said.
  await expect(page.getByRole("tab", { name: "Exportar" }).first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(announcement).toHaveText("Español");

  await switcher.selectOption("hi");
  await expect(announcement).toHaveText("हिन्दी");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");

  await switcher.selectOption("en");
  await expect(announcement).toHaveText("English");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  const said = await page.evaluate(() => (window as unknown as { said: string[] }).said);
  expect(said.filter(Boolean)).toEqual(["Español", "हिन्दी", "English"]);
});

test("a page that opens in the stored language announces nothing", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "fr"));
  await page.goto("/colors");
  await hydrated(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("language-announcement")).toHaveText("");
});
