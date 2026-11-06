import { spawn, type ChildProcess } from "node:child_process";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * An update from one build to the next, in a real browser, against two real servers on one port. The first
 * serves this build. The second serves the same build with a worker script that carries another build id, which is
 * all a deploy changes for the browser: it finds a new worker, installs it beside the old, asks the person to
 * reload, and on activation deletes the caches of the old build. (Two Next.js builds would test the same lifecycle
 * and take minutes. The page.route API cannot stand in: the browser fetches a worker script outside it.)
 */

const PORT = 3200;
const ORIGIN = `http://localhost:${PORT}`;
const root = process.cwd();

async function serve(directory: string): Promise<ChildProcess> {
  const child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], {
    cwd: directory,
    stdio: "ignore",
  });
  const until = Date.now() + 60_000;
  while (Date.now() < until) {
    if (
      await fetch(`${ORIGIN}/sw.js`).then(
        (response) => response.ok,
        () => false,
      )
    )
      return child;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill();
  throw new Error("The test server did not start");
}

async function stop(child: ChildProcess) {
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  child.kill();
  await exited;
  // The port is free once nothing answers on it.
  while (
    await fetch(ORIGIN).then(
      () => true,
      () => false,
    )
  )
    await new Promise((resolve) => setTimeout(resolve, 100));
}

/** This project, with a worker script that has another build id. The build itself is shared, not copied. */
async function nextBuild(): Promise<{ directory: string; oldId: string }> {
  const directory = await mkdtemp(join(tmpdir(), "designhub-next-build-"));
  await symlink(join(root, "node_modules"), join(directory, "node_modules"));
  await symlink(join(root, ".next"), join(directory, ".next"));
  for (const file of ["package.json", "next.config.ts"]) await cp(join(root, file), join(directory, file));
  await cp(join(root, "public"), join(directory, "public"), { recursive: true });
  const script = await readFile(join(root, "public/sw.js"), "utf8");
  const oldId = /const BUILD_ID = "([^"]+)"/.exec(script)?.[1] ?? "";
  await writeFile(join(directory, "public/sw.js"), script.replace(`"${oldId}"`, '"e2e-next-build"'));
  return { directory, oldId };
}

/** The cache names, or none while the page is reloading (a poll asks again). */
const cacheNames = (page: Page) => page.evaluate(() => caches.keys()).catch(() => [] as string[]);

test("a new build replaces the old caches, asks for a reload, and a studio opened before still opens offline", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const { directory, oldId } = await nextBuild();
  let server = await serve(root);
  const context = await browser.newContext({ baseURL: ORIGIN });
  try {
    const page = await context.newPage();
    await page.goto("/colors");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    // A second studio, kept by asking the worker, is one the page never shows again after the update. A third is never kept.
    await page.evaluate(async () => {
      navigator.serviceWorker.controller?.postMessage({ type: "REMEMBER_ROUTE", pathname: "/typography" });
    });
    await expect.poll(async () => await cacheNames(page)).toContain(`designhub-static-${oldId}`);

    await expect
      .poll(() => page.evaluate(async () => Boolean(await caches.match("/typography", { ignoreSearch: true }))))
      .toBe(true);

    // The deploy: the same address now serves the next build.
    await stop(server);
    server = await serve(directory);

    // The browser finds the new worker on its own check, and the page offers the reload a few seconds after
    // it loads (REGISTER_DELAY in pwa-register.tsx). Both builds' caches exist while the new worker waits.
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });
    await expect(page.getByText("Update available")).toBeVisible({ timeout: 30_000 });
    expect(await cacheNames(page)).toContain(`designhub-static-${oldId}`);

    await page.getByRole("button", { name: "Reload" }).click();
    await expect
      .poll(async () => await cacheNames(page), { timeout: 30_000 })
      .toContain("designhub-static-e2e-next-build");
    // Only the new build's caches remain: the old build's are deleted when the new worker takes over.
    await expect.poll(async () => (await cacheNames(page)).filter((name) => name.endsWith(`-${oldId}`))).toEqual([]);

    // The studio is kept again under the new build (the page tells the worker which studio it shows), and opens offline.
    await expect(page.locator("h1").first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(async () => Boolean(await caches.match("/colors", { ignoreSearch: true }))))
      .toBe(true);
    // The studio kept before the update is kept after it without being opened, and one never kept is not downloaded.
    await expect
      .poll(() => page.evaluate(async () => Boolean(await caches.match("/typography", { ignoreSearch: true }))), {
        timeout: 30_000,
      })
      .toBe(true);
    expect(await page.evaluate(async () => Boolean(await caches.match("/effects", { ignoreSearch: true })))).toBe(
      false,
    );
    await context.setOffline(true);
    await page.goto("/colors");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.goto("/typography");
    await expect(page.locator("h1").first()).toBeVisible();
  } finally {
    await context.close();
    await stop(server);
    await rm(directory, { recursive: true, force: true });
  }
});
