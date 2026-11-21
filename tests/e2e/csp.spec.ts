import { expect, test, type Page } from "@playwright/test";

import { studios } from "../../lib/navigation";
import { hydrated } from "./storage";

/**
 * The app runs under its Content-Security-Policy (next.config.ts): the header is sent, and no page, worker or file
 * made in the page breaks it. A blocked load fires a `securitypolicyviolation` event, which is collected here.
 */
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    Object.assign(window, { __csp: seen });
    document.addEventListener("securitypolicyviolation", (event) => {
      seen.push(`${event.violatedDirective}: ${event.blockedURI || event.sample}`);
    });
  });
});

test("every page is sent with the policy, and its parts that matter are closed", async ({ request }) => {
  for (const path of ["/", ...studios.map((studio) => studio.href)]) {
    const header = (await request.get(path)).headers()["content-security-policy"] ?? "";
    expect(header, path).toContain("default-src 'self'");
    expect(header, path).toContain("object-src 'none'");
    expect(header, path).toContain("frame-ancestors 'self'");
    expect(header, path).toContain("base-uri 'self'");
  }
});

for (const studio of [{ href: "/", title: "Home" }, ...studios]) {
  test(`${studio.title} loads and works with no policy violation`, async ({ page }) => {
    // Icon search and the AI provider are the only places that reach out; the Iconify hosts are answered here.
    await page.route("https://api.iconify.design/**", (route) => route.fulfill({ json: {} }));
    await page.goto(studio.href);
    await expect(page.locator("h1").first()).toBeVisible();
    await hydrated(page);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    const tabs = page.getByRole("tab");
    const count = await tabs.count();
    for (let index = 0; index < count; index += 1) {
      const tab = tabs.nth(index);
      if (!(await tab.isVisible())) continue;
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
    }
    expect(await violations(page), `${studio.title} breaks the policy`).toEqual([]);
  });
}

test("the service worker, the module worker and a file made in the page run under the policy", async ({ page }) => {
  await page.goto("/backgrounds");
  await hydrated(page);
  // The service worker registers a few seconds after load.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The heavy backgrounds draw in a module worker, started from the page.
  await page.getByRole("searchbox", { name: "Find a generator" }).fill("isometric");
  await page
    .getByRole("group", { name: "Generator" })
    .getByRole("radio", { name: /Isometric/ })
    .click();
  await page.getByRole("combobox", { name: "Canvas size" }).click();
  await page.getByRole("option", { name: /Full HD/ }).click();
  const slider = page.getByRole("slider", { name: "Density", exact: true });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("status").filter({ hasText: "Drawing" })).toHaveCount(0, { timeout: 30_000 });
  expect(page.workers().length).toBeGreaterThan(0);
  // A file made in the page is a blob: URL download.
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /^Download/ })
    .first()
    .click();
  await download;
  expect(await violations(page)).toEqual([]);
});
