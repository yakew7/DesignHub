import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Screenshots of the home page and five studios at three widths in light and dark, and of the phone pane bar, so a layout that looks
 * wrong fails even when every behaviour test passes. They run only in the visual workflow (VISUAL=1), on its
 * Linux image, where the images were made: other machines draw text a little differently. To update them after
 * an intended change, run that workflow by hand with "update" ticked, and read the new images in the commit.
 */
test.skip(process.env.VISUAL !== "1", "Screenshots are compared only in the visual workflow (VISUAL=1)");

const pages = [
  { name: "home", path: "/" },
  { name: "colors", path: "/colors" },
  { name: "effects", path: "/effects" },
  { name: "backgrounds", path: "/backgrounds" },
  { name: "logo", path: "/logo" },
  { name: "brand", path: "/brand" },
];
const widths = [375, 768, 1280];
const themes = ["light", "dark"] as const;

for (const { name, path } of pages) {
  for (const width of widths) {
    for (const theme of themes) {
      test(`${name} at ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
        await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        // Fonts and the first paint have settled, and nothing is loading.
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        await expect(page).toHaveScreenshot(`${name}-${width}-${theme}.png`);
      });
    }
  }
}

// The phone pane bar, with each pane of one studio open in turn.
for (const pane of ["Controls", "Preview", "Output"] as const) {
  for (const theme of themes) {
    test(`effects pane bar, ${pane} open, at 375px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
      await page.goto("/effects");
      await expect(page.locator("h1").first()).toBeVisible();
      await page.getByRole("navigation", { name: "Studio panes" }).getByRole("button", { name: pane }).click();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect(page).toHaveScreenshot(`effects-pane-${pane.toLowerCase()}-${theme}.png`);
    });
  }
}

// Each studio that has Simple and Advanced mode, in each mode. The pages are the ones in the guide's table of controls
// (docs/simple-and-advanced.md), so a studio added there gets its two screenshots with no other change.
function modePages(): string[] {
  const guide = readFileSync(join(__dirname, "../../docs/simple-and-advanced.md"), "utf8");
  const section = guide.split("## Controls the tests check")[1]?.split("\n## ")[0] ?? "";
  const paths = section
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|\s*(Page|-)/.test(line))
    .map((line) => line.split("|")[1]?.trim().replaceAll("`", "") ?? "")
    .filter((path) => /^\/[a-z-]+$/.test(path));
  return [...new Set(paths)];
}

for (const path of modePages()) {
  for (const mode of ["Simple", "Advanced"] as const) {
    test(`${path} in ${mode} mode at 1280px`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.addInitScript(() => window.localStorage.setItem("theme", "light"));
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      const group = page
        .getByRole("group", { name: "Controls shown" })
        .or(page.getByRole("radiogroup", { name: "Controls shown" }));
      await group.getByRole("radio", { name: mode }).click();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect(page).toHaveScreenshot(`mode-${path.slice(1)}-${mode.toLowerCase()}.png`);
    });
  }
}
