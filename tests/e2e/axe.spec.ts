import { expect, test } from "@playwright/test";

import { studios } from "../../lib/navigation";
import { DISABLED_RULES, scanWithTabs } from "./axe-scan";
import { hydrated } from "./storage";

/**
 * Runs axe on every studio in light and dark, on first view and again with each of the studio's tabs
 * opened (most studios put their tools behind tabs, which Lighthouse never looks at). Serious and critical
 * violations fail the test, and the message names the rule, the selector and the studio. The scan itself is in
 * axe-scan.ts, which forced-colors.spec.ts also uses.
 */
const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  test.describe(`axe, ${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const studio of studios) {
      test(`${studio.title} has no serious or critical violations`, async ({ page }) => {
        await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
        await page.goto(studio.href);
        await expect(page.locator("h1").first()).toBeVisible();
        // The server's markup is scanned by nobody: wait until React has taken it over (a slow engine scans it half done).
        await hydrated(page);

        const problems = await scanWithTabs(page, `${studio.title} (${theme})`);

        expect(problems, `Violations in ${studio.title}`).toEqual([]);
      });
    }
  });
}

test("the list of disabled rules is empty or explained", () => {
  for (const item of DISABLED_RULES) expect(item.reason.length, item.rule).toBeGreaterThan(20);
});
