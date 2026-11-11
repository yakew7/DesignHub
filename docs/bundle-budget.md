# Bundle budgets

Every route in DesignHub has a first-load client JavaScript budget in [`bundle-budget.json`](../bundle-budget.json), measured in gzipped kB. `pnpm bundle:size` checks the production build against those limits locally and in CI (`.github/workflows/bundle-size.yml`).

This guide explains how to run `pnpm bundle:size`, how to read both tables it prints, what is shared across every route versus loaded per studio, the three steps to try before raising a limit and when to edit `bundle-budget.json`. See [Measuring performance](performance.md) for the other performance tools.

## Running `pnpm bundle:size`

`scripts/bundle-size.mjs` reads the compiled production output in `.next`, so build first:

```bash
pnpm install
pnpm build
pnpm bundle:size
```

To compare your branch against `main`, save the baseline sizes from `main` to a JSON file (`bundle-size*.json` is gitignored) and pass `--base`:

```bash
git switch main && pnpm build && pnpm bundle:size --json bundle-size-main.json
git switch my-branch && pnpm build && pnpm bundle:size --base bundle-size-main.json
```

Useful flags:

| Flag                    | What it does                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `--base <file>`         | Compare each route against a JSON report saved with `--json`                       |
| `--threshold <percent>` | Fail when any route grows by more than this percentage vs `--base` (default: `10`) |
| `--budget <file>`       | Check routes against another budget file instead of `bundle-budget.json`           |
| `--no-budget`           | Skip the absolute budget check                                                     |
| `--json <file>`         | Write the measured route sizes (`raw`, `gzip`, `files`) to a JSON file             |
| `--dir <path>`          | Read the `.next` folder and `bundle-budget.json` from another directory            |

## Reading the output

`pnpm bundle:size` prints two Markdown tables.

### 1. The route size table

Without `--base`, the first table has three columns:

```markdown
| Route       | First-load JS (gzip) |      Raw |
| ----------- | -------------------: | -------: |
| `/`         |             311.2 kB | 982.4 kB |
| `/colors`   |             314.1 kB | 994.0 kB |
| `/projects` |             296.8 kB | 941.2 kB |
```

- **Route**: the URL path built from `app/**/page.tsx` (route groups like `(studio)` and `(marketing)` are stripped, and `/_not-found` is skipped).
- **First-load JS (gzip)**: the gzipped sum of every client `.js` chunk that Next.js loads on the first visit to that route. Each chunk file is counted once per route even if several manifests list it.
- **Raw**: the uncompressed byte total of those same `.js` files.

With `--base <file>`, two more columns appear:

```markdown
| Route     | First-load JS (gzip) |      Raw |    Change vs base | Status           |
| --------- | -------------------: | -------: | ----------------: | ---------------- |
| `/colors` |             314.1 kB | 994.0 kB |   +1.2 kB (+0.4%) | ok               |
| `/social` |             388.0 kB |  1.21 MB | +42.0 kB (+12.1%) | **+12.1% > 10%** |
```

- **Change vs base**: the signed gzipped delta in kB and percentage compared with the baseline file (`new` if the route did not exist on the base branch).
- **Status**: `ok`, `new` or `**+X.X% > 10%**`. If any route grows by more than the threshold (10% by default), `pnpm bundle:size` prints how many routes exceeded the threshold and exits with code `1`.

### 2. The `Budgets` table

Unless `--no-budget` is passed, `pnpm bundle:size` compares each route's gzipped kB (`gzip / 1024`) against `bundle-budget.json`:

```markdown
### Budgets

| Route       | First-load JS (gzip) | Budget | Status        |
| ----------- | -------------------: | -----: | ------------- |
| `/`         |             311.2 kB | 314 kB | ok            |
| `/colors`   |             316.4 kB | 315 kB | **over**      |
| `/new-tool` |             305.0 kB |      - | **no budget** |
```

- **Budget**: the route's limit in `bundle-budget.json` under `routes` (or `default` if one is set).
- **Status**:
  - `ok`: the route's gzipped size is at or below its budget (`kb <= limit`).
  - `**over**`: the route exceeds its limit (`kb > limit`). The command prints `**Over budget:** /route is X.X kB, over its budget of Y kB` and exits with code `1`.
  - `**no budget**`: a new route was added without an entry in `bundle-budget.json`. Add the route to `bundle-budget.json` in the same pull request.

When every route passes, the section ends with `Every route is within its budget.`

## Shared by every route vs per studio

`scripts/bundle-size.mjs` sums two sets of client chunks for each route:

1. **Shared by every route**:
   - **The framework runtime**: `rootMainFiles` in `.next/build-manifest.json` (Next.js router, React DOM and webpack runtime chunks).
   - **Root providers (`components/layout/providers.tsx`)**: `ThemeProvider`, `LocaleProvider`, `TooltipProvider`, `LazyOverlays` (command palette and keyboard shortcuts modal shell), `PwaRegister` (service worker listener) and `Toaster`.
   - **The English message catalog**: English is the fallback for every locale (while `es`, `fr` and `hi` load on demand), so `lib/i18n/messages/en-core.ts` is in every route's first load. Adding keys to it increases every route's gzipped size by the same amount. The Icon, Logo, Mockup, Social and SVG studios keep their English in `en-<area>.ts`, loaded by that studio's route (`EnglishAreas`, `lib/i18n/areas.ts`), so keys for those studios cost only their own route.
   - **The application shell (`components/layout/app-shell.tsx` and `app/(studio)/layout.tsx`)**: header navigation (`SiteHeader`, `MobileNav`, `SearchTrigger`, `LanguageSwitcher`, `ThemeToggle`), `SkipLink`, `GlobalShortcuts`, shared stores (such as the project, navigation and panel stores) and on studio routes `SidebarAside`, `StudioTracker`, `LazyProjectAutosave`, `LazyShareLinkImport` and `LazyFileLaunchImport`.
2. **Per studio (or route)**:
   - **The route's `entryJSFiles`**: read from `.next/server/app/**/page_client-reference-manifest.js` for that specific `page.tsx`.
   - **Studio controls, canvases and data**: the studio's own `"use client"` components, preview canvas, templates and any presets or libraries imported at the top of that studio's modules.

If **every route** jumps by 1 to 3 kB at once, look at shared code (`lib/i18n/messages/en-core.ts`, `components/layout/**` or a shared store in `lib/stores/**`). If **only one route** grows, look at what that route's `app/**/page.tsx` and its components import.

## Three steps before raising a limit

When a route fails the 10% growth check or goes over its budget in `bundle-budget.json`, try these three steps in order before touching `bundle-budget.json`:

### 1. Find the module

Compare the `.js` files listed for the route before and after your change, or inspect the imports you added:

- Run `pnpm bundle:size --json before.json` on `main` and `pnpm bundle:size --json after.json` on your branch; each route entry in the JSON output lists its `files` array with exact `.next/static/chunks/*.js` paths.
- Check whether a `"use client"` file imports a large library at the top of the file, or imports from a barrel file that pulls in unrelated studios or data tables.
- Check whether code that only runs on the server or at build time was imported into a client component.

### 2. Load it on demand

Code that is not visible on the first paint does not belong in the first-load bundle:

- **Folded panels, dialogs and secondary tabs**: wrap the component with `next/dynamic` so its chunk is fetched only when the person opens it. For example, `/projects` loads the folded Storage panel on demand (`perf(projects): load the Storage panel only when it is opened`, which lowered `/projects` from 315 kB to 299 kB), and `components/projects/lazy-autosave.tsx` defers autosave and share-link import hooks until after mount.
- **Export engines and heavy libraries**: load libraries used only when clicking a button (such as Paper.js boolean path operations, ZIP archiving or PDF/image export) inside the click handler with `await import("...")` instead of a top-level `import`.
- **Non-English locales**: keep new translation dictionaries behind the dynamic loader in `LocaleProvider` so only `en-core.ts` is in the initial bundle.

### 3. Replace it

If the code must run on first paint, make it smaller:

- Replace a heavy third-party package with a small pure function in `lib/` or a browser-native API (`Intl`, `CanvasRenderingContext2D`, `CompressionStream`, CSS primitives).
- Pass only the data fields a client component needs instead of importing an entire catalog on the client.
- Run `pnpm check:unused` (knip) to make sure dead exports or leftover dependencies from an earlier approach are removed.

## When to raise or lower a limit in `bundle-budget.json`

Each number in `bundle-budget.json` is an integer in gzipped kB, kept a couple of kB above the route's size on `main`:

- **When to raise a limit**: only in a reviewed change after trying the three steps above. Typical reasons are a deliberate new first-paint feature on a studio, a shared UI primitive added to a page, or new translation keys in `lib/i18n/messages/en.ts` that nudge several routes over their ceiling. Raise only the affected routes by the smallest whole kB that passes `pnpm bundle:size`, and state the reason in the pull request description.
- **When to add a route**: if your pull request adds a new `app/**/page.tsx` route, `pnpm bundle:size` fails with `no budget` until you add the route and its gzipped kB ceiling to `bundle-budget.json`.
- **When to lower a limit**: whenever a change shrinks a route's first-load JS (for example, after lazy-loading a panel or removing a dependency), lower that route's number in `bundle-budget.json` in the same pull request so future changes cannot quietly take the savings back.
