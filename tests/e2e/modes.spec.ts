import { expect, test, type Page } from "@playwright/test";
import { saved } from "./storage";

/** Controls that only Advanced mode shows, by studio: the panels and fields listed here are the whole split. */
const advancedPanels = [
  { path: "/typography", names: ["OpenType features"] },
  { path: "/logo", names: ["Guides", "Edit"] },
];

const modeGroup = (page: Page) =>
  page.getByRole("group", { name: "Controls shown" }).or(page.getByRole("radiogroup", { name: "Controls shown" }));

test("a first visit starts Simple, Advanced shows the rest, and hidden controls keep their values", async ({
  page,
}) => {
  await page.goto("/backgrounds");
  await expect(page.locator("h1").first()).toBeVisible();
  const mode = modeGroup(page);
  await expect(mode.getByRole("radio", { name: "Simple" })).toHaveAttribute("aria-checked", "true");

  // Simple: no seed field and no rotation slider, but Randomize and the main controls stay.
  await expect(page.getByLabel("Seed")).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Rotation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Randomize/ })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Density" })).toBeVisible();

  // Advanced: they are there, and a value set now survives a trip through Simple.
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await page.getByLabel("Seed").fill("4242");
  await mode.getByRole("radio", { name: "Simple" }).click();
  await expect(page.getByLabel("Seed")).toHaveCount(0);
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await expect(page.getByLabel("Seed")).toHaveValue("4242");
});

for (const { path, names } of advancedPanels) {
  test(`${path}: Simple hides ${names.join(" and ")}, Advanced shows them`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    const mode = modeGroup(page);
    await expect(mode.getByRole("radio", { name: "Simple" })).toHaveAttribute("aria-checked", "true");
    for (const name of names) await expect(page.getByRole("region", { name })).toHaveCount(0);
    await mode.getByRole("radio", { name: "Advanced" }).click();
    for (const name of names) await expect(page.getByRole("region", { name })).toHaveCount(1);
  });
}

test("the effect code formats are CSS and Tailwind in Simple and all five in Advanced", async ({ page }) => {
  await page.goto("/effects");
  const mode = modeGroup(page);
  await expect(mode.getByRole("radio", { name: "Simple" })).toHaveAttribute("aria-checked", "true");
  const formats = page.getByRole("radiogroup", { name: "Effect code format" }).getByRole("radio");
  await expect(formats).toHaveCount(2);
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await expect(formats).toHaveCount(5);
});

test("someone who already used the app starts Advanced", async ({ page }) => {
  // Use the app: a saved palette makes the person a returning one. Then forget only the mode choice.
  await page.goto("/colors");
  await expect(page.locator("h1").first()).toBeVisible();
  await page
    .getByRole("button", { name: /Generate|Shuffle|Randomize/i })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open("designhub");
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("kv", "readwrite");
          tx.objectStore("kv").delete("designhub:mode");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      }),
  );
  await page.goto("/typography");
  await expect(modeGroup(page).getByRole("radio", { name: "Advanced" })).toHaveAttribute("aria-checked", "true");
});

test("the export settings keep the name, prefix and color notation in Simple and add the bases and sections in Advanced", async ({
  page,
}) => {
  await page.goto("/export");
  const mode = modeGroup(page);
  await expect(mode.getByRole("radio", { name: "Simple" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("Variable prefix")).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Color notation" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Spacing base" })).toHaveCount(0);
  await expect(page.getByText("Include", { exact: true })).toHaveCount(0);
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await expect(page.getByRole("slider", { name: "Spacing base" })).toBeVisible();
  await expect(page.getByText("Include", { exact: true })).toBeVisible();
});

test("the Icon Studio hides corners and transforms in Simple and keeps their values", async ({ page }) => {
  await page.goto("/icons");
  await expect(page.locator("h1").first()).toBeVisible();
  const mode = modeGroup(page);
  await expect(mode.getByRole("radio", { name: "Simple" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radiogroup", { name: "Stroke corners" })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Rotation" })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Padding" })).toBeVisible();

  await mode.getByRole("radio", { name: "Advanced" }).click();
  const corners = page
    .getByRole("group", { name: "Stroke corners" })
    .or(page.getByRole("radiogroup", { name: "Stroke corners" }));
  await corners.getByRole("radio", { name: "Rounded" }).click();
  await mode.getByRole("radio", { name: "Simple" }).click();
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await expect(corners.getByRole("radio", { name: "Rounded" })).toHaveAttribute("aria-checked", "true");
});

test("the SVG Playground shows Layers and Sprite only in Advanced, and leaves them when Advanced is left", async ({
  page,
}) => {
  await page.goto("/svg");
  await expect(page.locator("h1").first()).toBeVisible();
  const mode = modeGroup(page);
  const tools = page.getByRole("tablist", { name: "SVG tools" });
  await expect(tools.getByRole("tab", { name: "Optimize" })).toBeVisible();
  await expect(tools.getByRole("tab", { name: "Layers" })).toHaveCount(0);
  await expect(tools.getByRole("tab", { name: "Sprite" })).toHaveCount(0);

  await mode.getByRole("radio", { name: "Advanced" }).click();
  await tools.getByRole("tab", { name: "Sprite" }).click();
  await expect(tools.getByRole("tab", { name: "Sprite" })).toHaveAttribute("aria-selected", "true");
  await mode.getByRole("radio", { name: "Simple" }).click();
  await expect(tools.getByRole("tab", { name: "Document" })).toHaveAttribute("aria-selected", "true");
});

test("the Accessibility Lab shows Contrast and Reading in Simple, the rest in Advanced, and the report is the same", async ({
  page,
}) => {
  await page.goto("/accessibility");
  await expect(page.locator("h1").first()).toBeVisible();
  const mode = modeGroup(page);
  const tabs = page.getByRole("tablist").first();
  await expect(mode.getByRole("radio", { name: "Simple" })).toHaveAttribute("aria-checked", "true");
  await expect(tabs.getByRole("tab", { name: "Contrast" })).toBeVisible();
  await expect(tabs.getByRole("tab", { name: "Reading" })).toBeVisible();
  for (const name of ["Vision", "Targets", "Motion"]) await expect(tabs.getByRole("tab", { name })).toHaveCount(0);
  const report = page.locator("pre").last();
  const simple = await report.innerText();

  await mode.getByRole("radio", { name: "Advanced" }).click();
  for (const name of ["Vision", "Targets", "Motion"]) await expect(tabs.getByRole("tab", { name })).toBeVisible();
  expect(await report.innerText()).toBe(simple);

  // Leaving Advanced from an Advanced tab goes back to Contrast.
  await tabs.getByRole("tab", { name: "Motion" }).click();
  await mode.getByRole("radio", { name: "Simple" }).click();
  await expect(tabs.getByRole("tab", { name: "Contrast" })).toHaveAttribute("aria-selected", "true");
});

test("the Mockup and Social studios keep content in Simple and put contact details and design overrides in Advanced", async ({
  page,
}) => {
  await page.goto("/mockups");
  await expect(page.locator("h1").first()).toBeVisible();
  const mode = modeGroup(page);
  await expect(page.getByLabel("Headline")).toBeVisible();
  for (const label of ["Email", "Phone", "Website", "Address"]) await expect(page.getByLabel(label)).toHaveCount(0);
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await page.getByLabel("Website").fill("example.test");
  await mode.getByRole("radio", { name: "Simple" }).click();
  await expect(page.getByLabel("Website")).toHaveCount(0);
  await mode.getByRole("radio", { name: "Advanced" }).click();
  await expect(page.getByLabel("Website")).toHaveValue("example.test");

  await page.goto("/social");
  await expect(page.locator("h1").first()).toBeVisible();
  const social = modeGroup(page);
  // The mode is one choice for every studio, and the Mockup part of this test left it on Advanced.
  await social.getByRole("radio", { name: "Simple" }).click();
  await expect(page.getByLabel("Project name")).toBeVisible();
  await expect(page.getByLabel("Show safe area")).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Padding" })).toHaveCount(0);
  await social.getByRole("radio", { name: "Advanced" }).click();
  await expect(page.getByLabel("Show safe area")).toBeVisible();
  await expect(page.getByRole("slider", { name: "Padding" })).toBeVisible();
});

test("the export settings fold the Include switches, and an opened fold stays open after a reload", async ({
  page,
}) => {
  await page.goto("/export");
  const advanced = modeGroup(page).getByRole("radio", { name: "Advanced" });
  // A click before the page has hydrated does nothing, so press again until the mode has changed.
  await expect(async () => {
    await advanced.click();
    await expect(advanced).toHaveAttribute("aria-checked", "true", { timeout: 1000 });
  }).toPass();
  const include = page.getByRole("button", { name: "Include", exact: true });
  await expect(include).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("group", { name: "Include" })).toBeHidden();
  await include.click();
  await expect(include).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("group", { name: "Include" })).toBeVisible();
  await saved(page, "designhub:panels", "export-settings-include");
  await page.reload();
  await expect(page.getByRole("button", { name: "Include", exact: true })).toHaveAttribute("aria-expanded", "true");
});
