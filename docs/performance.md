# Measuring performance

DesignHub has five tools for performance: bundle budgets, the unused code check, Lighthouse, long-task measurements in the end-to-end tests and the autosave counters. This page says what each one measures, how to run it and how to read the result. [CONTRIBUTING.md](../CONTRIBUTING.md) has the CI details; this page is the short version for working on a change.

Most of the tools read a production build, so start with:

```bash
pnpm install
pnpm build
```

## Bundle size

**What it measures.** The first-load client JavaScript of every route, gzipped and raw: the shared runtime from `.next/build-manifest.json` plus the page's own entry chunks. Each route also has a budget in `bundle-budget.json` (gzipped kB, a little above the size on `main`).

**How to run it.** After `pnpm build`:

```bash
pnpm bundle:size
```

To see what your branch changes, save the sizes of `main` first and compare against them:

```bash
git switch main && pnpm build && pnpm bundle:size --json bundle-size-main.json
git switch my-branch && pnpm build && pnpm bundle:size --base bundle-size-main.json
```

The isometric background test compares the longest task with `pageSpeed(page)` (`tests/e2e/timing.ts`), the time a fixed piece of work takes in the same page, and asserts a multiple of it, so a busy machine moves both sides and the test does not fail for load alone.

**How to read it.** The first table lists each route's size. With `--base` it gains "Change vs base" and "Status" columns, and the command fails when a route grows by more than 10% gzipped (change the limit with `--threshold <percent>`). The "Budgets" table ends with "Every route is within its budget." when nothing is over. A route over its budget fails the command and the `bundle-size.yml` check. Every route shares the Next.js runtime, the application shell (`Providers` and `AppShell`) and the English message catalog (`lib/i18n/messages/en.ts`), while each studio adds its own `page.tsx` entry chunks. Before raising a limit, try three steps in order: find the module that grew, load it on demand (`next/dynamic` or `import()` in an event handler) or replace it with a smaller helper. Raise a budget only in a reviewed change, by the smallest whole kB needed, with the reason in the pull request, and lower it when a route shrinks. See the [bundle budget guide](bundle-budget.md) for a full walkthrough of both tables and `bundle-budget.json`.

## Unused code

**What it measures.** Files, exports and dependencies that nothing uses, found by [knip](https://knip.dev). Dead code still costs install time, build time and reading time.

**How to run it.**

```bash
pnpm check:unused
```

**How to read it.** No list of findings and exit code 0 means nothing is unused (a "Configuration hints" line about `.css` is expected). Otherwise knip lists each unused file, export or dependency with its path. Delete it, or, if it is used in a way knip cannot see, add it to `knip.json` with the reason in the pull request.

## Lighthouse

**What it measures.** Lighthouse scores for performance, accessibility, best practices and SEO on the home page, `/brand`, `/colors`, `/projects`, `/typography` and `/social`, served from the production build. Each page is audited five times and the median run is checked against `lighthouserc.json`.

**How to run it.** It needs Chrome installed (set `CHROME_PATH` if Lighthouse cannot find it):

```bash
pnpm build && pnpm dlx @lhci/cli autorun
```

**How to read it.** The command starts `pnpm start -p 3000`, so stop any other server on that port first. It prints each assertion that failed or warned, with the median score it found and all five values, and writes the HTML reports to `.lighthouseci/`; open one to see the opportunities and diagnostics behind a score. Accessibility, best practices and SEO must be 100 on every page. Performance must be 90 on the home page and `/colors`, and 70 on `/projects` (a lower median fails); on the other studios a lower score is only a warning. The floors sit a few points under the scores on a laptop (about 100 for `/colors`, about 80 for `/projects`); raise one only with the score you measured, and lower one only with the reason in the pull request. Scores on a laptop or a busy machine are noisier than in CI, so compare runs of `main` and your branch on the same machine before chasing a few points.

## Long tasks in the end-to-end tests

**What it measures.** How long the main thread is blocked during an interaction. The browser reports every task over 50 ms as a [long task](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming); a test records them and fails when the longest is over a bound. `tests/e2e/font-browser.spec.ts` and `tests/e2e/background-picker.spec.ts` use this pattern.

**How to run it.** The tests run against the production build, so `pnpm build` first. Playwright then serves it with `pnpm start` on port 3100 (or `E2E_PORT`). Install the browser once, then run the specs:

```bash
pnpm exec playwright install chromium
pnpm exec playwright test tests/e2e/font-browser.spec.ts tests/e2e/background-picker.spec.ts
```

**How to read it.** A failure prints the longest task it saw, for example `Expected: < 300, Received: 366`. Run it again on an idle machine, and on `main`, before deciding it is your change: the bound is loose because these tests share the machine with the build and the other tests. The trace (`pnpm exec playwright show-trace <path>`, printed with the failure) shows what ran during the slow task.

### Worked example: the longest task of an interaction

To measure a new interaction, start observing before it and read the maximum after it:

```ts
await page.evaluate(() => {
  const longTasks: number[] = [];
  Object.assign(window, { longTasks });
  new PerformanceObserver((entries) => entries.getEntries().forEach((entry) => longTasks.push(entry.duration))).observe(
    { type: "longtask" },
  );
});

// The interaction: here, jumping to the end of the font list and paging back and forth.
await list.focus();
await page.keyboard.press("End");
for (let step = 0; step < 15; step += 1) await page.keyboard.press("PageUp");

const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
expect(longest).toBeLessThan(300);
```

`Math.max(0, ...)` returns 0 when no task was long, which is the goal: no task over 50 ms means the page answered every key press in time. Set the bound well above what you measure on a quiet machine, so the test catches a real regression (a task that moved back onto the main thread) and not a busy runner. Put heavy work in a worker or split it so each task stays short.

## Autosave counters

**What it measures.** How often Brand Projects asks to save, and how many of those saves wrote the project, found nothing to write, or were folded into a save already running. The counts are `requested`, `written`, `skipped` and `coalesced` in `lib/projects/save-plan.ts`.

**How to run it.** Start the development server, open a project, make some edits, then type this in the browser console:

```bash
pnpm dev
```

```js
__designhubSaves();
```

**How to read it.** It returns an object such as `{ requested: 4, written: 1, skipped: 3, coalesced: 0 }`. Most requests should be `skipped` while nothing changes; if `written` climbs while you are not editing, something is marking the project as changed when it is not. `coalesced` counts saves asked for while one was still running. With no project open, saves are counted as `requested` but neither written nor skipped. The counters exist only in development, and reset when the page reloads.
