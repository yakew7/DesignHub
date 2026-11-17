import { expect, test } from "@playwright/test";

import { esColors } from "../../lib/i18n/messages/es-colors";
import { esLogo } from "../../lib/i18n/messages/es-logo";

/**
 * A studio's Spanish messages load with the studio: opening the Color Studio in Spanish downloads the Color Studio's
 * Spanish messages and not the Logo Studio's.
 */
const longest = (messages: Record<string, string>) =>
  Object.values(messages).reduce((a, b) => (b.length > a.length ? b : a), "");
// A long sentence, so it is not a word the other chunks happen to hold too.
const COLORS_ONLY = longest(esColors);
const LOGO_ONLY = longest(esLogo);

test("in Spanish a studio downloads its own messages and no other studio's", async ({ page }) => {
  expect(COLORS_ONLY).toBeTruthy();
  expect(LOGO_ONLY).toBeTruthy();
  const bodies: string[] = [];
  page.on("response", async (response) => {
    if (!response.url().includes("/_next/static/chunks/")) return;
    bodies.push(await response.text().catch(() => ""));
  });
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "es"));
  await page.goto("/colors");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect.poll(() => bodies.some((body) => body.includes(COLORS_ONLY))).toBe(true);
  await page.waitForLoadState("networkidle");
  expect(bodies.some((body) => body.includes(LOGO_ONLY))).toBe(false);
  // The page itself is in Spanish.
  await expect(page.getByRole("tab", { name: esColors["colors.tab.export"] }).first()).toBeVisible();
});
