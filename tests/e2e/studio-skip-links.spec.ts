import { expect, test, type Page } from "@playwright/test";

test("skip links jump to the preview and the export pane", async ({ page }) => {
  await page.goto("/effects");
  const preview = page.getByRole("link", { name: "Skip to preview" });
  const output = page.getByRole("link", { name: "Skip to code and exports" });
  await expect(preview).toHaveCount(1);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(preview).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#studio-preview")).toBeFocused();

  await page.goto("/effects");
  await output.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#studio-output")).toBeFocused();
});

test.describe("on a phone, one pane shows at a time", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the bar switches panes and the skip links open a hidden one", async ({ page }) => {
    await page.goto("/effects");
    const bar = page.getByRole("navigation", { name: "Studio panes" });
    await expect(bar).toBeVisible();
    const controls = page.locator('section[aria-label="Controls"]');
    const preview = page.locator("#studio-preview");
    const output = page.locator("#studio-output");

    await expect(controls).toBeVisible();
    await expect(preview).toBeHidden();
    await expect(output).toBeHidden();

    await bar.getByRole("button", { name: "Preview" }).click();
    await expect(preview).toBeVisible();
    await expect(controls).toBeHidden();
    await expect(bar.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true");

    await page.goto("/effects");
    await page.getByRole("link", { name: "Skip to code and exports" }).focus();
    await page.keyboard.press("Enter");
    await expect(output).toBeVisible();
    await expect(output).toBeFocused();
  });

  test("the open pane is announced and remembered for the studio after a reload", async ({ page }) => {
    await page.goto("/effects");
    const bar = page.getByRole("navigation", { name: "Studio panes" });
    await bar.getByRole("button", { name: "Output" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Output pane shown" })).toBeAttached();
    await expect(page.locator("#studio-output")).toBeVisible();

    await page.reload();
    await expect(page.locator("#studio-output")).toBeVisible();
    await expect(bar.getByRole("button", { name: "Output" })).toHaveAttribute("aria-pressed", "true");
    // Another studio keeps its own choice.
    await page.goto("/backgrounds");
    await expect(bar.getByRole("button", { name: "Controls" })).toHaveAttribute("aria-pressed", "true");
  });

  test("a desktop width has no bar and shows every pane", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/effects");
    await expect(page.getByRole("navigation", { name: "Studio panes" })).toBeHidden();
    await expect(page.locator("#studio-preview")).toBeVisible();
    await expect(page.locator("#studio-output")).toBeVisible();
  });
});

test.describe("swiping between panes on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  /** A touch drag from one point to another, sent to the element under the first point. */
  async function swipe(page: Page, selector: string, dx: number) {
    await page
      .locator(selector)
      .first()
      .evaluate((element, distance) => {
        const box = element.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + Math.min(box.height / 2, 40);
        const point = (clientX: number) =>
          new Touch({ identifier: 1, target: element, clientX, clientY: y, radiusX: 1, radiusY: 1 });
        const send = (type: string, touches: Touch[], changed: Touch[]) =>
          element.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches,
              targetTouches: touches,
              changedTouches: changed,
            }),
          );
        const first = point(x);
        send("touchstart", [first], [first]);
        const last = point(x + distance);
        send("touchmove", [last], [last]);
        send("touchend", [], [last]);
      }, dx);
  }

  test("a swipe moves one pane, stops at the ends, and leaves sliders and the canvas to their own gestures", async ({
    page,
  }) => {
    await page.goto("/effects");
    await expect(page.locator("h1").first()).toBeVisible();
    const bar = page.getByRole("navigation", { name: "Studio panes" });
    const pressed = (name: string) => expect(bar.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
    await pressed("Controls");

    // Left goes on, right goes back, and the ends hold.
    await swipe(page, 'section[aria-label="Controls"] h2', -200);
    await pressed("Preview");
    await swipe(page, "#studio-preview", -200);
    await pressed("Output");
    await swipe(page, "#studio-output", -200);
    await pressed("Output");
    await swipe(page, "#studio-output", 200);
    await pressed("Preview");
    await swipe(page, "#studio-preview", 200);
    await pressed("Controls");
    await swipe(page, 'section[aria-label="Controls"] h2', 200);
    await pressed("Controls");

    // A slider keeps its own drag.
    await swipe(page, 'section[aria-label="Controls"] [role="slider"]', -200);
    await pressed("Controls");

    // A short or mostly vertical move is not a swipe.
    await swipe(page, 'section[aria-label="Controls"] h2', -30);
    await pressed("Controls");
  });

  test("the canvas keeps its own pan gesture", async ({ page }) => {
    await page.goto("/backgrounds");
    await expect(page.locator("h1").first()).toBeVisible();
    const bar = page.getByRole("navigation", { name: "Studio panes" });
    await bar.getByRole("button", { name: "Preview" }).click();
    await swipe(page, "#studio-preview [data-no-swipe]", -200);
    await expect(bar.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true");
    // The same swipe beside the canvas does move on.
    await swipe(page, "#studio-preview", -200);
    await expect(bar.getByRole("button", { name: "Output" })).toHaveAttribute("aria-pressed", "true");
  });

  test("a swipe is ignored on a desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/effects");
    await expect(page.locator("#studio-preview")).toBeVisible();
    await swipe(page, 'section[aria-label="Controls"] h2', -200);
    await expect(page.locator("#studio-preview")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Studio panes" })).toBeHidden();
  });
});
