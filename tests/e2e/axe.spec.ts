import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { studios } from "../../lib/navigation";

/**
 * Runs axe on every studio in light and dark, on first view and again with each of the studio's tabs
 * opened (most studios put their tools behind tabs, which Lighthouse never looks at). Serious and critical
 * violations fail the test, and the message names the rule, the selector and the studio.
 */
const THEMES = ["light", "dark"] as const;

/**
 * Rules switched off, each with the reason. There are none today: add one only for something outside the
 * app's control (a third-party canvas, for example), with a linked issue, never as a blanket disable.
 */
const DISABLED_RULES: { rule: string; reason: string }[] = [];

/**
 * Regions where one rule is skipped, each with the reason. Everything else is still checked in them.
 * `data-user-colors` marks swatches, ramps and previews that show the person's own colors with their
 * contrast ratios: a pair that fails WCAG there is the information being shown, not a defect.
 */
const USER_COLORS = "[data-user-colors]";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function scan(page: Page, where: string): Promise<string[]> {
  // A lazily loaded tab shows a placeholder first; scan what the person ends up with, not the placeholder.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const disabled = DISABLED_RULES.map((item) => item.rule);
  // One analysis of the whole page with every rule. A contrast failure inside a user-color region is the
  // information being shown, so those are dropped afterwards (the other rules still apply there).
  const analysis = await new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules(disabled)
    .options({ resultTypes: ["violations"] })
    .analyze();
  const results = { violations: [] as typeof analysis.violations };
  for (const violation of analysis.violations) {
    if (violation.id !== "color-contrast") {
      results.violations.push(violation);
      continue;
    }
    const outside = [];
    for (const node of violation.nodes) {
      const inside = await page.evaluate(
        ([selector, region]) => Boolean(document.querySelector(selector)?.closest(region)),
        [node.target.join(" "), USER_COLORS],
      );
      if (!inside) outside.push(node);
    }
    if (outside.length > 0) results.violations.push({ ...violation, nodes: outside });
  }
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id} (${violation.impact}) at ${node.target.join(" ")} in ${where}`),
    );
}

for (const theme of THEMES) {
  test.describe(`axe, ${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const studio of studios) {
      test(`${studio.title} has no serious or critical violations`, async ({ page }) => {
        await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
        await page.goto(studio.href);
        await expect(page.locator("h1").first()).toBeVisible();

        const problems = await scan(page, `${studio.title}, first view (${theme})`);

        // Open every tab the studio has, one at a time, and scan what it shows.
        const tabs = page.getByRole("tab");
        const count = await tabs.count();
        for (let index = 0; index < count; index += 1) {
          const tab = tabs.nth(index);
          if (!(await tab.isVisible()) || (await tab.getAttribute("aria-selected")) === "true") continue;
          const name = ((await tab.innerText()) || (await tab.getAttribute("aria-label")) || `tab ${index + 1}`).trim();
          await tab.click();
          await expect(tab).toHaveAttribute("aria-selected", "true");
          problems.push(...(await scan(page, `${studio.title}, ${name} tab (${theme})`)));
        }

        expect([...new Set(problems)], `Violations in ${studio.title}`).toEqual([]);
      });
    }
  });
}

test("the list of disabled rules is empty or explained", () => {
  for (const item of DISABLED_RULES) expect(item.reason.length, item.rule).toBeGreaterThan(20);
});
