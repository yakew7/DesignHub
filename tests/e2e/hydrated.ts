import { expect, type Page } from "@playwright/test";

/**
 * Waits until React has taken over the page. A click before that does nothing, so call this after `goto` or
 * `reload` and before the first interaction. It waits for the page, never for a fixed time.
 */
export async function hydrated(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const heading = document.querySelector("h1");
        // React puts its props on every element it has hydrated.
        return heading !== null && Object.keys(heading).some((key) => key.startsWith("__reactProps$"));
      }),
    )
    .toBe(true);
}
