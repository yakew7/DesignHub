import { expect, test } from "@playwright/test";

import { studios } from "../../lib/navigation";

/**
 * Longer translations can overflow narrow controls. Every studio is opened at 320 px in Spanish, French and Hindi:
 * the page must not scroll sideways, and no button, tab or radio may cut its own text off.
 */
const LANGUAGES = ["es", "fr", "hi"] as const;

for (const language of LANGUAGES) {
  test.describe(`at 320 px in ${language}`, () => {
    test.use({ viewport: { width: 320, height: 700 } });

    for (const studio of studios) {
      test(`${studio.title} fits`, async ({ page }) => {
        await page.addInitScript((value) => window.localStorage.setItem("designhub:locale", value), language);
        await page.goto(studio.href);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

        const found = await page.evaluate(() => {
          const wide = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          const clipped = [...document.querySelectorAll<HTMLElement>("button, [role=tab], [role=radio], a")]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              if (box.width < 8 || box.height < 8) return false;
              const style = getComputedStyle(element);
              // A visually hidden control (a skip link until it is focused) is not on screen.
              if ((style.clip !== "auto" && style.clip !== "") || style.clipPath !== "none") return false;
              // Text that is meant to be shortened (an ellipsis) is not a defect; text cut with no ellipsis is.
              const hidden = style.overflowX === "hidden" || style.overflowX === "clip";
              return hidden && style.textOverflow !== "ellipsis" && element.scrollWidth > element.clientWidth + 1;
            })
            .map((element) => (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 60));
          return { wide, clipped };
        });
        expect(found.wide, `${studio.title} scrolls sideways by ${found.wide} px`).toBeLessThanOrEqual(0);
        expect(found.clipped, `${studio.title} has controls that cut their text`).toEqual([]);
      });
    }
  });
}
