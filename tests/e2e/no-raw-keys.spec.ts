import { expect, test } from "@playwright/test";

import { studios } from "../../lib/navigation";

/**
 * English messages of a studio area are registered by the code that uses them (lib/i18n/areas/). A file that uses a
 * key without importing its area would show the key itself. Every studio is opened, with each of its tabs, and no
 * visible text or label may look like a message key.
 */
const KEY =
  /\b(?:a11y|backgrounds?|brand|colors|command|compare|effects|error|history|home|icons|logo|mockups|nav|projects|search|share|social|studio|svg|typography)\.[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9-]+)+\b/;

for (const studio of studios) {
  test(`${studio.title} shows no raw message keys`, async ({ page }) => {
    await page.goto(studio.href);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    const found = async () =>
      page.evaluate((source) => {
        const pattern = new RegExp(source);
        const texts = [document.body.innerText];
        for (const element of document.querySelectorAll("[aria-label], [title], [placeholder]")) {
          for (const name of ["aria-label", "title", "placeholder"]) texts.push(element.getAttribute(name) ?? "");
        }
        return texts.map((text) => pattern.exec(text)?.[0]).filter((match): match is string => Boolean(match));
      }, KEY.source);
    expect(await found(), `${studio.title}, first view`).toEqual([]);
    const tabs = page.getByRole("tab");
    const count = await tabs.count();
    for (let index = 0; index < count; index += 1) {
      const tab = tabs.nth(index);
      if (!(await tab.isVisible())) continue;
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      expect(await found(), `${studio.title}, tab ${index + 1}`).toEqual([]);
    }
  });
}
