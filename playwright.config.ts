import { defineConfig, devices } from "@playwright/test";

/** The app is served from a production build (`pnpm build`) on E2E_PORT, so CI tests what ships. */
const port = Number(process.env.E2E_PORT ?? 3100);

/**
 * `CROSS_BROWSER=1` runs the routes test and the axe scan in Firefox and WebKit instead of the whole suite in
 * Chromium (the nightly workflow does, and so can anyone: `CROSS_BROWSER=1 pnpm exec playwright test`).
 */
const crossBrowser = process.env.CROSS_BROWSER === "1";
const crossTests = /(routes|axe)\.spec\.ts$/;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  // Screenshots are made by the visual workflow on its Linux image, so one set serves every machine that
  // runs it there (see tests/e2e/visual.spec.ts). They are not named by platform.
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide" } },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["list"], ["json", { outputFile: process.env.E2E_REPORT ?? "test-results/report.json" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: crossBrowser
    ? [
        { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: crossTests },
        { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: crossTests },
      ]
    : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    env: { PORT: String(port) },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
