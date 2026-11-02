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
