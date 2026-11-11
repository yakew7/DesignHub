import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SECTIONS = ["Overview", "Offline use", "Projects", "Protection"];

async function openStoragePanel(page: Page) {
  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await expect(page.locator("button[data-section-toggle]").first()).toBeVisible();
}

// Section headings only: the page has other buttons such as "Projects".
const heading = (page: Page, name: string) =>
  page.locator("button[data-section-toggle]").filter({ hasText: new RegExp(`^${name}$`) });

/** The polite live region of the section whose heading is `name`. */
const announcement = (page: Page, name: string) =>
  heading(page, name).locator("xpath=ancestor::section[1]").locator(':scope > [aria-live="polite"]');

async function seriousViolations(page: Page): Promise<string[]> {
  const analysis = await new AxeBuilder({ page })
    .include("section:has([data-section-toggle])")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .options({ resultTypes: ["violations"] })
    .analyze();
  return analysis.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .flatMap((violation) => violation.nodes.map((node) => `${violation.id} at ${node.target.join(" ")}`));
}

test("toggling a storage section tells a screen reader it opened or closed", async ({ page }) => {
  await openStoragePanel(page);
  for (const name of SECTIONS) await expect(announcement(page, name)).toHaveText("");

  await heading(page, "Overview").focus();
  await page.keyboard.press("Enter");
  await expect(heading(page, "Overview")).toHaveAttribute("aria-expanded", "false");
  await expect(announcement(page, "Overview")).toHaveText("Overview section closed");

  await heading(page, "Offline use").click();
  await expect(heading(page, "Offline use")).toHaveAttribute("aria-expanded", "true");
  await expect(announcement(page, "Offline use")).toHaveText("Offline use section opened");
});

test("the arrow keys move between the section headings, which stay plain buttons", async ({ page }) => {
  await openStoragePanel(page);
  for (const name of SECTIONS) {
    const button = heading(page, name);
    await expect(button).toHaveAttribute("aria-expanded", /true|false/);
    expect(await button.evaluate((element) => element.tagName)).toBe("BUTTON");
  }

  await heading(page, "Overview").focus();
  await page.keyboard.press("ArrowDown");
  await expect(heading(page, "Offline use")).toBeFocused();
  await page.keyboard.press("End");
  await expect(heading(page, "Protection")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(heading(page, "Overview")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(heading(page, "Protection")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(heading(page, "Overview")).toBeFocused();
});

test("the storage sections pass axe with every section open and with every section closed", async ({ page }) => {
  await openStoragePanel(page);
  for (const expanded of ["true", "false"]) {
    for (const name of SECTIONS) {
      const button = heading(page, name);
      if ((await button.getAttribute("aria-expanded")) !== expanded) await button.click();
      await expect(button).toHaveAttribute("aria-expanded", expanded);
    }
    expect(await seriousViolations(page), `with every section ${expanded === "true" ? "open" : "closed"}`).toEqual([]);
  }
});
