import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { saved } from "./storage";

test("the storage panel shows sizes, and clearing the offline cache keeps the projects", async ({ page }) => {
  // Let the service worker install so there is an offline cache to clear.
  await page.goto("/colors");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).some((name) => name.startsWith("designhub-static-"))))
    .toBe(true);

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  const status = page.getByRole("status").filter({ hasText: "Offline cache" });
  await expect(status).toContainText("Projects");
  await expect(status).toContainText("Version history");
  await expect(status).not.toContainText("None yet");
  const projects = (await status.locator("dd").first().innerText()).split(" · ")[0];

  // The studios used last are kept again on their own, which could land right after the clear; this test is
  // about the clear, so that is switched off first (the next test covers the switch).
  await page.getByRole("button", { name: "Offline use", exact: true }).click();
  const keep = page.getByRole("switch", { name: "Keep my recent studios" });
  await expect(keep).toBeChecked();
  await keep.click();
  await expect(keep).not.toBeChecked();
  await page.getByRole("button", { name: "Clear the offline cache" }).click();
  await expect(status).toContainText("None yet");
  // The share cache and the projects are untouched: the same number of projects is still counted.
  expect((await status.locator("dd").first().innerText()).split(" · ")[0]).toBe(projects);
  await expect(page.getByRole("button", { name: "Clear the offline cache" })).toHaveCount(0);
});

test("the panel lists the largest projects and trims old versions with an undo, keeping the newest", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();

  // Three versions of the open project, written as an older version of the app wrote them: whole rows.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const read = db.transaction("projects").objectStore("projects").getAll();
          read.onsuccess = () => {
            const project = read.result[0];
            const day = 24 * 60 * 60 * 1000;
            const write = db.transaction("versions", "readwrite");
            const store = write.objectStore("versions");
            [400, 200, 1].forEach((daysAgo, index) =>
              store.put({
                id: `old-${index}`,
                projectId: project.id,
                createdAt: Date.now() - daysAgo * day,
                reason: "autosave",
                snapshot: project.snapshot,
              }),
            );
            write.oncomplete = () => resolve();
            write.onerror = () => reject(write.error);
          };
        };
      }),
  );
  await page.reload();

  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  const status = page.getByRole("status").filter({ hasText: "Largest projects" });
  await expect(status).toContainText("Acme");

  // 90 days: the 400 and 200 day old versions go; the newest stays.
  const trim = page.getByRole("button", { name: "Delete 2 versions" });
  await expect(trim).toBeVisible();
  await trim.click();
  await expect(page.getByText("Deleted 2 versions")).toBeVisible();
  await expect(page.getByRole("button", { name: "No versions are that old" })).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Restored 2 versions")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete 2 versions" })).toBeVisible();
});

test("the panel says whether the data is protected and asks the browser only when the button is pressed", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  let asked = false;
  await page.exposeFunction("markAsked", () => (asked = true));
  await page.evaluate(() => {
    const original = navigator.storage.persist.bind(navigator.storage);
    navigator.storage.persist = () => {
      (window as unknown as { markAsked: () => void }).markAsked();
      return original();
    };
  });
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await page.getByRole("button", { name: "Protection", exact: true }).click();
  const status = page.getByRole("status").filter({ hasText: "Largest projects" });
  await expect(status).toContainText(/Protected:|Not protected:|cannot say/);
  // Looking never asks.
  expect(asked).toBe(false);

  const protect = page.getByRole("button", { name: "Protect my data" });
  if (await protect.count()) {
    await protect.click();
    await expect.poll(() => asked).toBe(true);
    await expect(page.getByText(/will keep your data|did not agree/)).toBeVisible();
  }
});

test("a studio that was never opened can be kept for offline use from the panel, and then opens offline", async ({
  page,
  context,
}) => {
  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await page.getByRole("button", { name: "Offline use", exact: true }).click();
  const group = page.getByRole("group", { name: "Keep studios for offline use" });
  const effects = group.getByRole("checkbox", { name: /^Effects/ });
  await expect(effects).not.toBeChecked();
  expect(await page.evaluate(async () => Boolean(await caches.match("/effects", { ignoreSearch: true })))).toBe(false);

  await effects.check();
  await group.getByRole("button", { name: "Keep 1 studio" }).click();
  await expect(page.getByText(/^Kept 1 studio \(/)).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(async () => Boolean(await caches.match("/effects", { ignoreSearch: true }))))
    .toBe(true);
  // The panel now shows it as kept, and it cannot be chosen again.
  await expect(group.getByRole("checkbox", { name: /^Effects/ })).toBeDisabled();

  await context.setOffline(true);
  await page.goto("/effects");
  await expect(page.locator("h1").first()).toBeVisible();
});

test("the icon cache can be cleared on its own, and the projects stay", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
  // Two cached icons, written as the Icon Studio writes them.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const write = open.result.transaction("icons", "readwrite");
          for (const id of ["mdi:one", "mdi:two"]) {
            write
              .objectStore("icons")
              .put({ id, body: "<path d='M0 0h24v24H0z'/>", width: 24, height: 24, cachedAt: Date.now() });
          }
          write.oncomplete = () => resolve();
          write.onerror = () => reject(write.error);
        };
      }),
  );
  await page.reload();

  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  const status = page.getByRole("status").filter({ hasText: "Icon cache" });
  await expect(status).toContainText(/Removes 2 cached icons/);
  const projects = (await status.locator("dd").first().innerText()).split(" · ")[0];

  await page.getByRole("button", { name: "Clear the icon cache" }).click();
  await expect(page.getByText("Icon cache cleared")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear the icon cache" })).toHaveCount(0);
  // The projects are untouched.
  expect((await status.locator("dd").first().innerText()).split(" · ")[0]).toBe(projects);
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
});

test("the panel's sections start folded, and the ones opened stay open after a reload", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  const projects = page.getByRole("button", { name: "Projects", exact: true });
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(projects).toHaveAttribute("aria-expanded", "false");
  await projects.click();
  await expect(projects).toHaveAttribute("aria-expanded", "true");
  await saved(page, "designhub:panels", "storage-projects");
  await page.reload();
  await page.getByRole("button", { name: "Check storage" }).click();
  await expect(page.getByRole("button", { name: "Projects", exact: true })).toHaveAttribute("aria-expanded", "true");
});

test("the panel says so when the storage is nearly full, and its button opens the old versions", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.storage, "estimate", {
      value: async () => ({ usage: 85_000_000, quota: 100_000_000 }),
    });
  });
  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await expect(page.getByText(/Storage is 85% full/)).toBeVisible();
  const projects = page.getByRole("button", { name: "Projects", exact: true });
  await expect(projects).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Show old versions" }).click();
  await expect(projects).toHaveAttribute("aria-expanded", "true");
});

test("the recent studios are listed under the switch, kept or with a Keep now button, and hidden when it is off", async ({
  page,
}) => {
  await page.goto("/colors");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  // Two studios used: Color Studio, chosen in the palette, and Brand Projects, opened last.
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByRole("dialog")
    .getByRole("option", { name: /^Color Studio/ })
    .click();
  await saved(page, "designhub:command-recents", "studio:colors");
  await page.goto("/projects");
  const kept = (href: string) =>
    page.evaluate(async (path) => Boolean(await caches.match(path, { ignoreSearch: true })), href);
  await expect.poll(() => kept("/colors"), { timeout: 30_000 }).toBe(true);
  await expect.poll(() => kept("/projects"), { timeout: 30_000 }).toBe(true);
  // Brand Projects goes from the caches, so the list offers to keep it again.
  await page.evaluate(async () => {
    for (const name of await caches.keys()) await (await caches.open(name)).delete("/projects", { ignoreSearch: true });
  });

  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await page.getByRole("button", { name: "Offline use", exact: true }).click();
  const list = page.getByRole("list", { name: "Your recent studios" });
  await expect(list.getByRole("listitem")).toHaveText([/^Brand Projects/, /^Color.*Available offline$/]);
  await expect(list.getByRole("button")).toHaveCount(1);
  await list.getByRole("button", { name: "Keep now: Brand Projects" }).click();
  await expect(list.getByRole("listitem").first()).toHaveText(/^Brand Projects.*Available offline$/);
  expect(await kept("/projects")).toBe(true);

  const scan = await new AxeBuilder({ page })
    .include("section:has(#storage-recent)")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .options({ resultTypes: ["violations"] })
    .analyze();
  expect(
    scan.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => violation.id),
  ).toEqual([]);

  await page.getByRole("switch", { name: "Keep my recent studios" }).click();
  await expect(list).toHaveCount(0);
});

test("the studios used last are kept again on their own, and the switch turns it off and is remembered", async ({
  page,
}) => {
  await page.goto("/colors");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await saved(page, "designhub:nav", "colors");
  // Opening /projects below makes it the last studio, so Color Studio is also chosen in the palette: a recent
  // choice stays saved however the next page loads.
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByRole("dialog")
    .getByRole("option", { name: /^Color Studio/ })
    .click();
  await saved(page, "designhub:command-recents", "studio:colors");
  const kept = () => page.evaluate(async () => Boolean(await caches.match("/colors", { ignoreSearch: true })));
  await expect.poll(kept).toBe(true);

  // The caches go (as an update would delete them); the next visit keeps the last studio again.
  await page.evaluate(async () => {
    for (const name of await caches.keys())
      if (name.startsWith("designhub-static-") || name.startsWith("designhub-runtime-")) await caches.delete(name);
  });
  expect(await kept()).toBe(false);
  await page.goto("/projects");
  await expect.poll(kept, { timeout: 30_000 }).toBe(true);

  // The switch is on by default, turns off, and stays off after a reload.
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  await page.getByRole("button", { name: "Offline use", exact: true }).click();
  const keep = page.getByRole("switch", { name: "Keep my recent studios" });
  await expect(keep).toBeChecked();
  await keep.click();
  await expect(keep).not.toBeChecked();
  await saved(page, "designhub:nav", '"keepRecent":false');
  await page.reload();
  await page.getByRole("button", { name: "Check storage" }).click();
  await expect(page.getByRole("switch", { name: "Keep my recent studios" })).not.toBeChecked();
});
