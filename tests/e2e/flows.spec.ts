/**
 * End-to-end flows: what people do across studios, each from a clean browser. A break between two
 * studios (a brand change that never reaches an export, a project that does not survive a round trip)
 * fails here before it reaches a release. Playwright gives every test a fresh context, so nothing is
 * shared between them.
 *
 * Known gaps, which cannot be tested yet:
 * - Installing the app (the browser's install prompt is not scriptable).
 * - Opening a `.designhub.json` from the operating system (covered with a stand-in in file-launch.spec.ts).
 */
import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

/** Waits for a studio's heading, so the test continues from a settled page and never from a fixed delay. */
async function ready(page: Page) {
  await expect(page.locator("h1").first()).toBeVisible();
}

test("brand to export: a new primary color reaches the CSS in the Export Engine", async ({ page }) => {
  await page.goto("/brand");
  await ready(page);

  // The row whose role is Primary: change its color.
  const newColor = "#ff0000";
  const primary = page.getByRole("list", { name: "Brand colors" }).getByRole("listitem").filter({ hasText: "Primary" });
  await primary.locator('input[type="color"]').first().fill(newColor);
  await expect(primary.getByText(newColor, { exact: false })).toBeVisible();

  // Move on through the app's own navigation, the way a person would, and open the CSS format.
  await page.getByRole("link", { name: "Export Engine" }).first().click();
  await expect(page).toHaveURL(/\/export$/);
  await ready(page);
  // Write colors as HEX, so the check does not depend on how a color rounds in OKLCH.
  await page
    .getByRole("group", { name: "Color notation" })
    .or(page.getByRole("radiogroup", { name: "Color notation" }))
    .getByRole("radio", { name: "hex" })
    .click();
  await page.getByRole("radio", { name: "CSS variables" }).click();

  const css = page.getByLabel("tokens.css contents");
  await expect(css).toBeVisible();
  await expect(css).toContainText(newColor, { ignoreCase: true });
});

test("projects: a project survives export, delete and import with its name and tags", async ({ page }) => {
  await page.goto("/projects");
  await ready(page);

  // Create a project with a name of its own.
  const name = "Flow Test Brand";
  await page.getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New brand project" });
  await dialog.getByLabel("Brand name").fill(name);
  await dialog.getByRole("button", { name: "Create and open" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  await page.goto("/projects");
  // The open project's title button reads "<name> (open)", the others "Open <name>".
  const card = page.getByRole("button", { name: new RegExp(`^(Open )?${name}( \\(open\\))?$`) });
  await expect(card).toBeVisible();

  // Give it a tag.
  await page.getByRole("button", { name: `Add a tag to ${name}` }).click();
  await page.getByLabel(`New tag for ${name}`).fill("client");
  await page.keyboard.press("Enter");
  await expect(page.getByText("client", { exact: true }).first()).toBeVisible();

  // Export it as JSON: the file is a real download.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: `Export ${name} as JSON` }).click();
  const file = await (await download).path();
  const json = JSON.parse(await readFile(file, "utf8")) as { name: string; tags: string[] };
  expect(json).toMatchObject({ name, tags: ["client"] });

  // Delete it.
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await page
    .getByRole("dialog", { name: `Delete ${name}?` })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(card).toHaveCount(0);

  // Import the same file: the name and the tag come back.
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(card).toBeVisible();
  await expect(page.getByText("client", { exact: true }).first()).toBeVisible();
});

test("keyboard only: the command palette, a jump with G and a letter, and the code in an export", async ({ page }) => {
  await page.goto("/");
  await ready(page);

  // Open the command palette from the keyboard and go to a studio by name.
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog");
  await expect(palette).toBeVisible();
  await page.keyboard.type("Typography");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/typography$/);
  await ready(page);

  // Jump with G, then a letter: E is the Export Engine.
  // The shortcut listener attaches when the page hydrates, which can lag on a busy machine: try again until it is there.
  await expect(async () => {
    await page.keyboard.press("g");
    await page.keyboard.press("e");
    await expect(page).toHaveURL(/\/export$/, { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  await ready(page);

  // Tab through the page until the code of an export has focus: it is reachable with no mouse.
  let reached = false;
  for (let step = 0; step < 120 && !reached; step += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement && active.tagName === "PRE" && Boolean(active.getAttribute("aria-label"));
    });
  }
  expect(reached, "the exported code never received keyboard focus").toBe(true);
});

test("offline: a studio that was opened online still opens with no connection", async ({ page, context }) => {
  // The service worker keeps the shell at once and a studio the first time it is opened with a connection.
  await page.goto("/colors");
  await ready(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  // A second studio, opened online from the app's navigation, is kept too.
  await page.getByRole("link", { name: "Typography" }).first().click();
  await expect(page).toHaveURL(/\/typography$/);
  await ready(page);
  await expect
    .poll(() => page.evaluate(async () => Boolean(await caches.match("/typography", { ignoreSearch: true }))))
    .toBe(true);

  await context.setOffline(true);
  await page.goto("/colors");
  await ready(page);
  await expect(page.locator("h1").first()).toContainText("Color");

  await page.goto("/typography");
  await ready(page);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("offline: a studio never opened online says so instead of failing blank", async ({ page, context }) => {
  await page.goto("/colors");
  await ready(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.goto("/effects");
  await expect(page.getByRole("heading", { name: "This page is not on this device yet" })).toBeVisible();
});

test("offline: the sidebar marks the studios kept for offline use, and says so for one that is not", async ({
  page,
  context,
}) => {
  await page.goto("/colors");
  await ready(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const nav = page.getByRole("navigation", { name: "Studios" });
  const kept = (name: string | RegExp) =>
    nav.getByRole("link", { name }).getByRole("img", { name: "Available offline" });
  // The studio that is open is kept (the page tells the worker which studio it shows), and another is not.
  await expect(kept(/^Color/)).toBeVisible({ timeout: 20_000 });
  await expect(kept("Typography")).toHaveCount(0);

  // Offline, a link to a studio that is not kept explains itself instead of opening an error page.
  await context.setOffline(true);
  await nav.getByRole("link", { name: "Typography" }).click();
  await expect(page.getByText("This studio has not been opened on this device yet.")).toBeVisible();
  await expect(page).toHaveURL(/\/colors$/);
});
