import { expect, test } from "@playwright/test";

/** The palette is short until something is typed, and remembers what was chosen. */
test("the palette opens short, remembers a choice and shows the rest as you type", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();

  const items = page.locator("[cmdk-item]");
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog");
  await expect(palette).toBeVisible();

  // Nothing typed: studios and a few actions, under about 30 items, with no recents yet and none of the long tail.
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeLessThan(30);
  await expect(palette.getByText("Recent", { exact: true })).toHaveCount(0);
  await expect(palette.getByText("View source on GitHub")).toHaveCount(0);
  await expect(palette.getByText("Download brand book (PDF)")).toHaveCount(0);

  // Choose a studio: it is the first recent the next time.
  await palette.getByRole("option", { name: /^Color Studio/ }).click();
  // A first visit to a studio fetches its code, which a loaded machine takes a while over.
  await expect(page).toHaveURL(/\/colors$/, { timeout: 20_000 });
  await expect(page.locator("h1").first()).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(palette.getByText("Recent", { exact: true })).toBeVisible();
  await expect(palette.getByRole("option").first()).toContainText("Color Studio");

  // Typing brings back what was left out. The search field must have focus first.
  await expect(palette.getByRole("combobox")).toBeFocused();
  await page.keyboard.type("source");
  await expect(palette.getByText("View source on GitHub")).toBeVisible();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await expect(palette.getByText("View source on GitHub")).toHaveCount(0);

  // Recents can be cleared from the palette.
  await palette.getByRole("option", { name: "Clear recent choices" }).click();
  await expect(palette.getByText("Recent", { exact: true })).toHaveCount(0);
});

test("the palette opened again straight after a choice keeps the search field focused", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  const palette = page.getByRole("dialog");
  await page.keyboard.press("ControlOrMeta+k");
  await palette.getByRole("option", { name: /^Color Studio/ }).click();
  // Opened again at once, while the first palette is still handing focus back and the studio is still loading.
  await page.keyboard.press("ControlOrMeta+k");
  await expect(palette.getByRole("combobox")).toBeFocused();
  await page.keyboard.type("source");
  await expect(palette.getByRole("combobox")).toHaveValue("source");
});

test("the palette collapses the sidebar on a desktop", async ({ page }) => {
  await page.goto("/effects");
  await expect(page.locator("h1").first()).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Studios" });
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog");
  // The phone's pane actions do not apply here.
  await expect(palette.getByRole("option", { name: "Show the preview" })).toHaveCount(0);
  await palette.getByRole("option", { name: "Collapse sidebar" }).click();
  await expect.poll(() => nav.evaluate((node) => node.getBoundingClientRect().width)).toBeLessThan(80);

  await page.keyboard.press("ControlOrMeta+k");
  await expect(palette.getByRole("option", { name: "Expand sidebar" })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the palette shows a pane of the studio", async ({ page }) => {
    await page.goto("/effects");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.getByRole("dialog");
    // The sidebar does not exist on a phone.
    await expect(palette.getByRole("option", { name: /sidebar/i })).toHaveCount(0);
    await palette.getByRole("option", { name: "Show the output" }).click();
    await expect(page.locator("#studio-output")).toBeVisible();
    await expect(page.locator("#studio-preview")).toBeHidden();
  });
});
