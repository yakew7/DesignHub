import { expect, type Page } from "@playwright/test";

/**
 * Waits until the saved settings stored under `key` contain `text`. A store is written to IndexedDB a moment after
 * it changes, so a test that reloads straight away can beat the write; this waits for it, never for a fixed time.
 */
export async function saved(page: Page, key: string, text: string) {
  await expect
    .poll(() =>
      page.evaluate(
        ([wantedKey, wanted]) =>
          new Promise<boolean>((resolve) => {
            const open = indexedDB.open("designhub");
            open.onerror = () => resolve(false);
            open.onsuccess = () => {
              const request = open.result.transaction("kv").objectStore("kv").get(wantedKey);
              request.onsuccess = () => resolve(String(request.result?.value ?? "").includes(wanted ?? ""));
              request.onerror = () => resolve(false);
            };
          }),
        [key, text],
      ),
    )
    .toBe(true);
}

/**
 * Waits until the page has hydrated. A click or a typed value before that does nothing, because the app's handlers
 * are not attached yet. Call it after `page.goto` or `page.reload`, before the first interaction.
 */
export async function hydrated(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

/**
 * Confirms the preview that opens when a project file holds several projects, importing every project in it (all are
 * checked at first). A file with one project imports without it, so do not call this for that.
 */
export async function confirmImport(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Choose what to import" });
  await dialog.getByRole("button", { name: /^Import \d+ projects?$/ }).click();
  await expect(dialog).toBeHidden();
}
