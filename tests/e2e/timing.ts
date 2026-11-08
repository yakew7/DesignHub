import { expect, type Page, type TestInfo } from "@playwright/test";

/**
 * A timing bound that is checked on a developer machine and only recorded on CI. Shared runners are slower and
 * noisier than any bound that is useful locally, so there the number is attached to the report, not asserted.
 */
export async function expectUnder(testInfo: TestInfo, name: string, value: number, limit: number) {
  await testInfo.attach(name, { body: String(Math.round(value)), contentType: "text/plain" });
  if (!process.env.CI) expect(value, `${name} (ms)`).toBeLessThan(limit);
}

/**
 * How long a fixed piece of main-thread work takes in this page now, in ms. A busy machine makes it longer in the
 * same proportion as everything else, so a bound written as a multiple of it holds on a slow or loaded machine.
 */
export async function pageSpeed(page: Page): Promise<number> {
  return page.evaluate(() => {
    const start = performance.now();
    let sum = 0;
    for (let index = 0; index < 20_000_000; index += 1) sum += index % 7;
    return performance.now() - start + (sum < 0 ? 1 : 0);
  });
}
