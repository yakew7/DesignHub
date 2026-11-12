import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { expectUnder, pageSpeed } from "./timing";

type Entry = { favorite: boolean; tags: string[]; snapshot: { brand: { profile: { name: string } } } };

const COUNT = 5000;

test("typing a search in 5,000 projects does not block input for long (#546)", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const fixture = JSON.parse(readFileSync(join(__dirname, "../../lib/projects/__fixtures__/v1/projects.json"), "utf8"));
  const template = fixture.projects[0] as Entry;
  template.snapshot.brand.profile.name = "Seed";
  fixture.projects = [template];
  const file = join(tmpdir(), "designhub-search-seed.json");
  writeFileSync(file, JSON.stringify(fixture));

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(page.getByRole("button", { name: "Open Seed" })).toBeVisible();

  // Importing 5,000 projects would take minutes, so the one imported is copied straight into IndexedDB, with a
  // summary row each (the list drops a row whose project is missing).
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("designhub");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const read = db.transaction(["projects", "summaries"]).objectStore("summaries").getAll();
          read.onsuccess = () => {
            const row = (read.result as { id: string; name: string }[]).find((item) => item.name === "Seed")!;
            const copy = db.transaction("projects").objectStore("projects").get(row.id);
            copy.onsuccess = () => {
              const project = copy.result as Record<string, unknown>;
              const write = db.transaction(["projects", "summaries"], "readwrite");
              const words = ["Acme", "Labs", "Zeta", "Studio", "North", "Orbit"];
              for (let index = 0; index < count; index += 1) {
                const id = `search-${index}`;
                const name = `${words[index % words.length]} ${index}`;
                write.objectStore("projects").put({ ...project, id, updatedAt: index, lastOpenedAt: index });
                write.objectStore("summaries").put({ ...row, id, name, updatedAt: index, lastOpenedAt: index });
              }
              write.oncomplete = () => {
                db.close();
                resolve();
              };
              write.onerror = () => reject(write.error);
            };
          };
        };
      }),
    COUNT,
  );

  await page.reload();
  const search = page.getByLabel("Search projects");
  await expect(search).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open \w+ \d+$/ }).first()).toBeVisible();
  const speed = await pageSpeed(page);

  // The longest task on the main thread while typing (a long task is one over 50 ms, so none reads as 0), and the
  // longest key press from input to the next paint.
  await page.evaluate(() => {
    const longest = { task: 0, key: 0 };
    (window as unknown as { __longest: typeof longest }).__longest = longest;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longest.task = Math.max(longest.task, entry.duration);
    }).observe({ type: "longtask" });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longest.key = Math.max(longest.key, entry.duration);
    }).observe({ type: "event", durationThreshold: 16 } as PerformanceObserverInit);
  });
  await search.click();
  // `Labs 4999` is the only name with both words (4999 % 6 is 1).
  await search.pressSequentially("labs 4999", { delay: 40 });
  await expect(page.getByRole("button", { name: "Open Labs 4999" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open \w+ \d+$/ })).toHaveCount(1);

  const longest = await page.evaluate(
    () => (window as unknown as { __longest: { task: number; key: number } }).__longest,
  );
  await testInfo.attach("page-speed-ms", { body: String(Math.round(speed)), contentType: "text/plain" });
  await testInfo.attach("search-longest-key-ms", { body: String(Math.round(longest.key)), contentType: "text/plain" });
  await expectUnder(testInfo, "search-longest-task-ms", longest.task, 50);
});
