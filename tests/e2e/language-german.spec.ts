import { expect, test, type Browser } from "@playwright/test";

import { hydrated } from "./storage";

/**
 * German is added with every message still in English (`languagesInProgress`). It is listed in the language switcher,
 * choosing it keeps the page in English (the fallback) and sets the document's `lang`, and its core and area parts are
 * loaded the way the other languages' are: each chunk once, the same chunks as for Spanish.
 */

/** The script chunks a studio downloads in a language, each by URL, with how often it was requested. */
async function chunksIn(browser: Browser, locale: string, path: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = new Map<string, number>();
  page.on("request", (request) => {
    const url = request.url();
    if (!url.includes("/_next/static/chunks/") || !url.includes(".js")) return;
    requests.set(url, (requests.get(url) ?? 0) + 1);
  });
  await page.addInitScript((value) => window.localStorage.setItem("designhub:locale", value), locale);
  await page.goto(path);
  await hydrated(page);
  // A language in progress shows English text, so the document says English until it is translated.
  await expect(page.locator("html")).toHaveAttribute("lang", locale === "de" ? "en" : locale);
  await page.waitForLoadState("networkidle");
  await context.close();
  return requests;
}

test("German is in the language switcher, and choosing it keeps the page in English, and the document says so", async ({
  page,
}) => {
  await page.goto("/colors");
  await hydrated(page);
  const switcher = page
    .locator("select")
    .filter({ has: page.locator('option[value="de"]') })
    .first();
  await expect(switcher.locator("option")).toHaveText(["English", "Español", "Français", "हिन्दी", "Deutsch"]);
  await expect(switcher.locator('option[value="de"]')).toHaveAttribute("lang", "de");

  await switcher.selectOption("de");
  // Nothing is translated yet, so the studio reads as it does in English, and the document says so.
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("tab", { name: "Export" }).first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("tab", { name: "Export" }).first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("in German the parts load like Spanish's: every chunk once, and as many as for Spanish", async ({ browser }) => {
  const english = await chunksIn(browser, "en", "/colors");
  const spanish = await chunksIn(browser, "es", "/colors");
  const german = await chunksIn(browser, "de", "/colors");

  const extra = (requests: Map<string, number>) => [...requests.keys()].filter((url) => !english.has(url));
  // The core and the studio's part of the language come on top of what English loads.
  expect(extra(german).length).toBeGreaterThan(0);
  expect(extra(german).length).toBe(extra(spanish).length);
  for (const [url, count] of german) expect(count, url).toBe(1);
});
