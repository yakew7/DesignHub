import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * docs/simple-and-advanced.md lists, control by control, what each mode shows. This opens every page in both modes
 * and checks the list against the real page, so a control that moves between modes without its row changing fails here.
 */
type Row = { path: string; role: string; name: string; from: "simple" | "advanced" };

function rows(): Row[] {
  const guide = readFileSync(join(__dirname, "../../docs/simple-and-advanced.md"), "utf8");
  const section = guide.split("## Controls the tests check")[1]?.split("\n## ")[0] ?? "";
  return section
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|\s*(Page|-)/.test(line))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replaceAll("`", "")),
    )
    .filter((cells) => cells.length === 4)
    .map(([path, role, name, from]) => ({ path: path!, role: role!, name: name!, from: from as Row["from"] }));
}

const table = rows();
const paths = [...new Set(table.map((row) => row.path))];

async function setMode(page: Page, mode: "Simple" | "Advanced") {
  const group = page
    .getByRole("group", { name: "Controls shown" })
    .or(page.getByRole("radiogroup", { name: "Controls shown" }));
  await group.getByRole("radio", { name: mode }).click();
}

test("the table is not empty and names real pages", () => {
  expect(table.length).toBeGreaterThan(15);
  for (const row of table) expect(row.path, JSON.stringify(row)).toMatch(/^\/[a-z-]+$/);
});

for (const path of paths) {
  test(`${path}: every control in the guide is shown in the mode it says`, async ({ page }) => {
    const mine = table.filter((row) => row.path === path);
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();

    for (const mode of ["Simple", "Advanced"] as const) {
      await setMode(page, mode);
      for (const row of mine) {
        const control = page.getByRole(row.role as Parameters<Page["getByRole"]>[0], { name: row.name, exact: true });
        const shown = mode === "Advanced" || row.from === "simple";
        const message = `${row.path} ${row.role} "${row.name}" in ${mode} mode (the guide says it is shown from ${row.from})`;
        if (shown) await expect(control.first(), message).toBeVisible();
        else await expect(control, message).toHaveCount(0);
      }
    }
  });
}
