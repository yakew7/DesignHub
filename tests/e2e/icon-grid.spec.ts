import { expect, test } from "@playwright/test";

const TOTAL = 600;
const ids = Array.from({ length: TOTAL }, (_, index) => `mdi:glyph-${index}`);

test("a search with hundreds of results keeps about a screenful of icons in the page, and Tab walks them all", async ({
  page,
}) => {
  const fetched = new Set<string>();
  await page.route("https://api.iconify.design/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/search") {
      return route.fulfill({ json: { icons: ids, total: TOTAL } });
    }
    if (url.pathname.endsWith(".json")) {
      const names = (url.searchParams.get("icons") ?? "").split(",");
      names.forEach((name) => fetched.add(name));
      return route.fulfill({
        json: {
          prefix: "mdi",
          width: 24,
          height: 24,
          icons: Object.fromEntries(names.map((name) => [name, { body: '<path d="M2 2h20v20H2z"/>' }])),
        },
      });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/icons");
  await page.getByLabel("Search icons").fill("glyph");
  const grid = page.getByRole("list", { name: "Icons" }).last();
  // Wait for the search results (the featured icons show first): every tile knows the size of the whole list.
  await expect(grid.locator(`li[aria-setsize="${TOTAL}"]`).first()).toBeVisible();

  // Only the rows near the view exist, and only their bodies were asked for.
  expect(await grid.getByRole("button").count()).toBeLessThanOrEqual(120);
  await expect.poll(() => fetched.size).toBeGreaterThan(0);
  expect(fetched.size).toBeLessThan(TOTAL / 2);

  // Scrolling to the end draws the last icons and keeps the count small.
  await grid.evaluate((list) => list.parentElement?.scrollIntoView({ block: "end", behavior: "instant" }));
  await expect(grid.getByRole("button", { name: `mdi:glyph-${TOTAL - 1}` })).toBeVisible();
  expect(await grid.getByRole("button").count()).toBeLessThanOrEqual(120);

  // The grid is one tab stop, and the arrow keys move through every icon, drawing each one before focusing it.
  await grid.evaluate((list) => list.parentElement?.scrollIntoView({ block: "start", behavior: "instant" }));
  const first = grid.getByRole("button").first();
  await expect(first).toHaveAttribute("data-index", "0");
  expect(await grid.locator('button[tabindex="0"]').count()).toBe(1);
  await first.focus();
  const focusedIndex = () =>
    page.evaluate(() => Number((document.activeElement as HTMLElement | null)?.getAttribute("data-index") ?? -1));

  await page.keyboard.press("ArrowRight");
  expect(await focusedIndex()).toBe(1);
  await page.keyboard.press("ArrowLeft");
  expect(await focusedIndex()).toBe(0);
  await page.keyboard.press("ArrowDown");
  const columns = await focusedIndex();
  expect(columns).toBeGreaterThan(1);
  await page.keyboard.press("ArrowUp");
  expect(await focusedIndex()).toBe(0);
  // A move past the start stops there.
  await page.keyboard.press("ArrowLeft");
  expect(await focusedIndex()).toBe(0);

  await page.keyboard.press("PageDown");
  expect(await focusedIndex()).toBeGreaterThan(columns);
  await page.keyboard.press("End");
  expect(await focusedIndex()).toBe(TOTAL - 1);
  await expect(grid.getByRole("button", { name: `mdi:glyph-${TOTAL - 1}` })).toBeFocused();
  expect(await grid.getByRole("button").count()).toBeLessThanOrEqual(120);
  await page.keyboard.press("Home");
  expect(await focusedIndex()).toBe(0);

  // Tab leaves the grid after one stop.
  await page.keyboard.press("Tab");
  const inGrid = await page.evaluate(() => Boolean(document.activeElement?.closest('ul[aria-label="Icons"]')));
  expect(inGrid).toBe(false);
});

test("the Library tab keeps its results, scroll and focused icon while another tab shows, and a new search starts at the top", async ({
  page,
}) => {
  let bodyRequests = 0;
  await page.route("https://api.iconify.design/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/search") return route.fulfill({ json: { icons: ids, total: TOTAL } });
    if (url.pathname.endsWith(".json")) {
      bodyRequests += 1;
      const names = (url.searchParams.get("icons") ?? "").split(",");
      return route.fulfill({
        json: {
          prefix: "mdi",
          width: 24,
          height: 24,
          icons: Object.fromEntries(names.map((name) => [name, { body: '<path d="M2 2h20v20H2z"/>' }])),
        },
      });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/icons");
  await page.getByLabel("Search icons").fill("glyph");
  const grid = page.getByRole("list", { name: "Icons" }).last();
  await expect(grid.locator(`li[aria-setsize="${TOTAL}"]`).first()).toBeVisible();

  // Move the focus well down the list and let the page follow it.
  await grid.locator('button[tabindex="0"]').first().focus();
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  const focusedIndex = () =>
    page.evaluate(() => Number((document.activeElement as HTMLElement | null)?.getAttribute("data-index") ?? -1));
  const index = await focusedIndex();
  expect(index).toBeGreaterThan(10);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  const scrolled = await page.evaluate(() => window.scrollY);

  // Look at another tab and come back: the same icon is focused, the page is where it was, and nothing was fetched again.
  const requests = bodyRequests;
  await page.getByRole("tab", { name: "Favicon" }).click();
  await expect(page.getByRole("tab", { name: "Favicon" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Library" }).click();
  await expect.poll(focusedIndex).toBe(index);
  // That icon is back in view, though the page had to be near the top to reach the tab.
  expect(scrolled).toBeGreaterThan(100);
  const inView = async () => {
    const box = await grid.locator('button[tabindex="0"]').first().boundingBox();
    const height = page.viewportSize()?.height ?? 0;
    return Boolean(box && box.y >= 0 && box.y + box.height <= height);
  };
  await expect.poll(inView).toBe(true);
  expect(bodyRequests).toBe(requests);

  // A new search is a new list and starts at the top, with nothing focused.
  await page.getByLabel("Search icons").fill("glyph-1");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(scrolled);
});
