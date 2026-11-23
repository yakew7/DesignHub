# Architecture

DesignHub is a static Next.js 16 (App Router) application. There is no server-side state: every page is prerendered, and all work happens in the browser.

## Routes

```
app/
├── (marketing)/page.tsx      → /            Homepage (Server Components + a small client search box)
├── (studio)/brand            → /brand       Brand Studio
├── (studio)/brand-dna        → /brand-dna   Brand DNA
├── (studio)/logo             → /logo        Logo Studio
├── (studio)/mockups          → /mockups     Mockup Studio
├── (studio)/social           → /social      Social Media Studio
├── (studio)/guidelines       → /guidelines  Brand Guidelines
├── (studio)/projects         → /projects    Brand Projects
├── (studio)/typography       → /typography  Typography Studio
├── (studio)/colors           → /colors      Color Studio
├── (studio)/icons            → /icons       Icon Studio
├── (studio)/backgrounds      → /backgrounds Background Studio
├── (studio)/effects          → /effects     Effects Lab
├── (studio)/svg              → /svg         SVG Playground
├── (studio)/accessibility    → /accessibility Accessibility Lab
├── (studio)/export           → /export      Export Engine
├── manifest.ts, robots.ts, sitemap.ts, icon.svg, not-found.tsx
└── layout.tsx                Root layout: fonts, metadata, providers
```

Route groups share layouts: `(marketing)` gets the header nav and footer; `(studio)` gets the persistent sidebar. Each studio page is a Server Component that renders a header and one client "workspace" component.

Most studios share `components/layout/studio-layout.tsx`: a resizable three-pane layout (controls · preview · code) built on react-resizable-panels, stacking on small screens. Vector previews use `components/canvas/svg-preview-canvas.tsx`.

## PWA and offline shell

The production build generates `public/sw.js` in the postbuild step. `scripts/generate-service-worker.mjs` reads the Next.js build ID from `.next/BUILD_ID`, discovers every App Router page, and reads the files each prerendered page loads (and the fonts its stylesheets point at). The source of the worker is `scripts/service-worker-source.mjs`, a pure function a unit test runs against a fake cache and fetch.

Installing downloads only the shell: the home page, the files every page shares and the icons (36 files, about 0.6 MB gzipped). A studio is kept the first time it is shown online: its files first, then its page. That happens when the page is requested by address, or when `components/layout/pwa-register.tsx` tells the worker which studio is showing (a link followed inside the app makes no request for the page, and a prefetch keeps nothing). A studio never opened online gets an offline note instead of a blank page.

The service worker uses two caches named with the build ID: the static cache (the shell and the kept studios) and a runtime cache capped at 300 files, oldest first. Runtime requests use these policies:

- `fonts.googleapis.com`: stale-while-revalidate.
- `fonts.gstatic.com`: cache-first.
- Iconify API hosts: network-first with a cache fallback.
- App navigations: network-first, then a kept page, then the offline note.
- Next.js static assets and other precached public assets: cache-first.

A new worker does not call `skipWaiting()` during installation. When it reaches the waiting state, `components/layout/pwa-register.tsx` shows an "Update available" toast. Reloading is only triggered after the user chooses the reload action. Activation removes older DesignHub caches.

The worker is registered only when `NODE_ENV` is production. Development builds never register it.

## Keeping pages light

- **Windowing.** `lib/windowing.ts` and `hooks/use-windowed-grid.ts` draw only the rows of a grid near the view (the Icon Studio results); the font browser windows its list the same way, and Brand Projects draws thirty cards and more as the end comes into view.
- **On demand.** Social and mockup templates, the token format being shown, the font catalog (an index plus one file per category) and every language but the active one are fetched when needed. Where a list and its code are separate, a test keeps them in step (`template-info.json` and the loaders).
- **Off the page.** The heavy background generators draw in a module worker (`lib/background/heavy.ts`, `render-protocol.ts`), keeping only the newest request. SVG cannot be decoded in a worker in Chromium, so PNG, WebP and PDF export still draw on the page.
- **Budgets.** `bundle-budget.json` sets a first-load limit per route and `pnpm bundle:size` enforces it; `pnpm check:unused` (knip) keeps dead code out.

## State

Each studio owns one [Zustand](https://zustand.docs.pmnd.rs) store in `store/`:

| Store              | Holds                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| `typography-store` | active font, heading/body pair, specimen, scale, rhythm, OpenType features, filters |
| `color-store`      | swatches, history (undo/redo), harmony, shade options, gradient, contrast pair      |
| `icon-store`       | query, collection, selected icon, style, favorite icons                             |
| `library-store`    | favorite fonts, recent fonts, saved pairs, saved palettes                           |
| `tokens-store`     | Export Engine settings, including radius and spacing bases                          |
| `effects-store`    | Effects Lab settings, including the shadow the brand uses                           |
| `brand-store`      | brand name, description, uploaded logo, color roles and voice                       |
| `logo-store`       | Logo Studio view: guides, clear space, selected variant                             |
| `mockup-store`     | mockup template, theme, copy and export scale                                       |
| `social-store`     | social template, theme, copy, safe-area toggle and scale                            |
| `guidelines-store` | selected page, excluded pages and book theme                                        |
| `project-store`    | the id of the open brand project                                                    |
| `brand-dna-store`  | the chosen Brand DNA provider                                                       |
| `ui-store`         | command palette and shortcuts dialog (not persisted)                                |

Persistent stores use Zustand's `persist` middleware with `indexedDbStorage` from `lib/db.ts`, a small adapter over a [Dexie](https://dexie.org) key-value table. Hydration is asynchronous, so server-rendered HTML always matches the defaults and saved state arrives right after mount.

For a user-facing list of every store and how to reset them, see [storage.md](storage.md).

A second Dexie table (`icons`) caches Iconify glyph bodies, which is why icons you have opened keep working offline. A third (`projects`, schema v3) stores brand projects. A fourth (`versions`, schema v4) stores per-project version history. Every Dexie call goes through `safeDb`, which times out and falls back to memory, so blocked storage never breaks a studio.

## Brand architecture

The brand never duplicates state. `brand-store` keeps only what is unique to the brand (name, description, uploaded logo, color roles, voice). Everything else has one owner: colors in `color-store`, fonts and scale in `typography-store`, radius and spacing in `tokens-store`, shadow in `effects-store`. `useBrandTokens()` (`hooks/use-brand.ts`) composes them into `BrandTokens` on every render, so an edit in any studio updates the brand everywhere.

From there:

- `lib/brand/theme.ts` derives light and dark surfaces with guaranteed text contrast.
- `hooks/use-draw-context.ts` adds those surfaces, embedded font CSS and text measurement. Mockups, social assets and guideline pages are pure functions of this context that return SVG (`lib/mockups`, `lib/social`, `lib/guidelines`).
- `lib/export/raster.ts` and `lib/export/pdf.ts` turn any of that SVG into PNG, JPEG or PDF; `lib/zip.ts` bundles packs.
- `lib/projects/snapshot.ts` lists every brand-defining store. A project is a snapshot of them; opening one writes the snapshot back into the live stores, and `ProjectAutosave` keeps the open project current.
- `lib/brand-dna` defines the `BrandDnaProvider` interface. Providers run in the browser and return editable results that are applied through the same stores. See [Adding a Brand DNA provider](brand-dna-providers.md) for the provider contract and registration steps.

## Logic lives in `lib/`

UI components stay thin, and the real work is plain TypeScript functions that are easy to test and reuse:

- `lib/color/` - the OKLCH color model (`Oklch` type), conversions and formatting (`color.ts`, `engine.ts`), harmonies, shades, gradients, WCAG contrast and color-vision simulation.
- `lib/typography/` - the font catalog, Google Fonts URL building, filtering, pairing, type scales and `clamp()`, OpenType definitions and exports.
- `lib/icons/` - the Iconify client (memory → IndexedDB → network), the SVG builder, rasterization, ICO encoding and the favicon package.
- `lib/background/` - seeded PRNG, smoothing, patterns, the eight generators and background CSS export. Paper.js is loaded on demand (`lib/background/paper.ts`).
- `lib/effects/` - effect definitions and the CSS, Tailwind, `@utility`, SCSS and React writers, plus effect tokens.
- `lib/svg/` - svgson parsing, a serializer (minify / pretty print), the optimizer and path optimizer, the inspector, JSX / React / React Native converters and the sprite builder.
- `lib/a11y/` - contrast pairs, vision re-measurement, readability metrics, touch-target rules and the JSON report.
- `lib/brand/`, `lib/logo/`, `lib/mockups/`, `lib/social/`, `lib/guidelines/`, `lib/projects/`, `lib/brand-dna/` - the brand platform described above.
- `lib/tokens/` - the shared `DesignTokens` model (`build.ts`), the format generators (one module per format in `formats/`, listed in `formats.ts`, with tiers in `tiers.ts`) and the PDF style guide (`pdf.ts`).
- `lib/zip.ts` - a dependency-free ZIP (store) writer used by every "download all" button.

## Color model

OKLCH is the source of truth for every color in the app. It is perceptually uniform, so shades, harmonies and gradients look evenly spaced. Values are converted to HEX / RGB / HSL only at the edges (display and export), with CSS Color 4 gamut mapping into sRGB.

## Fonts

The font catalog is generated from public Google Fonts metadata by `scripts/generate-font-catalog.mjs`, so the app needs no API key. It is two kinds of file: `lib/typography/catalog-index.json` (family and category in popularity order, about 7 kB gzipped, which is all a font picker or a token hook needs) and `lib/typography/catalog/<category>.json` (the details). Each is a dynamic `import()` in its own chunk, so a page that names one font fetches only the category that holds it (`useFontMeta`), and browsing loads them all (`useFontCatalog`). Fonts are loaded on demand through the Google Fonts CSS API. Grid previews add `&text=` so only the rendered glyphs download.

## Performance notes

- The command palette and shortcuts dialog mount on first use (`components/layout/lazy-overlays.tsx`). Every shortcut is listed in [shortcuts.md](shortcuts.md).
- Secondary tabs in each studio are loaded with `next/dynamic`.
- Heavy libraries are imported where they're used: OpenType.js (font inspector), pdf-lib (style guide, brand book, mockup PDF) and html-to-image (snapshots).
- Brand assets in the Export Engine and project autosave load after hydration with `next/dynamic`.
- Color.js uses its tree-shakable `colorjs.io/fn` entry with only the spaces we need registered.
- Third-party SVG is rendered through `<img>` data URLs, never injected into the DOM.

## Translation layer

The UI language is chosen per viewer, not per brand. Catalogs live in `lib/i18n/messages/` (`en`, `es`, `fr`, `hi`). `lib/i18n/locales.ts` lists the locales; `lib/i18n/translate.ts` builds `t` and `plural` with English as the fallback for missing keys. `lib/i18n/errors.ts` wraps throwables as `LocalizedError` so toasts can translate them. `components/layout/locale-provider.tsx` (mounted from `components/layout/providers.tsx`) holds the live locale; Server Components use `components/layout/message.tsx` (`<Message id="…" />`) because they cannot call `useI18n()`.

**Persists in:** `localStorage` key `designhub:locale` via `lib/i18n/storage.ts`. Without it, the browser language is used (`resolveLocale`). Theme and brand stores stay separate; locale is never part of a project snapshot.

```
viewer preference (or navigator.languages)
        │
        ▼
preferredLocale() ──► LocaleProvider ──► createTranslator(catalog)
        │                     │
        │                     ├── useI18n().t / .plural  (client UI)
        │                     └── <Message id>           (server pages)
        ▼
localStorage "designhub:locale"
```

## Version history

Each open project keeps up to 20 earlier brand snapshots. Pure rules live in `lib/projects/history.ts` (`planVersion`, `sameSnapshot`, caps and reasons). IndexedDB reads and writes go through `lib/projects/versions.ts` (`listVersions`, `recordVersion`, `autoVersion`, `checkpoint`). Project actions in `lib/projects/actions.ts` call those on save, restore and delete. The **History** dialog is `components/projects/project-history.tsx`.

**Persists in:** Dexie `versions` table (`id, projectId, createdAt`), added in database schema v4 in `lib/db.ts`. Memory fallback mirrors projects when IndexedDB is blocked. Deleting a project deletes its versions; undo restores both. Optional project JSON export can include history (`exportHistory` in `store/project-store.ts` via `lib/projects/transfer.ts`). Share links never include history. See [storage.md](storage.md#version-history).

```
edit / risky action / restore
        │
        ├── saveActiveProject ──► autoVersion (every few minutes, previous snapshot)
        ├── checkpoint(reason) ──► recordVersion (surprise, import, Brand DNA, …)
        └── restoreVersion ──► recordVersion("restore") then apply snapshot
                │
                ▼
        Dexie versions (≤20 per project) ──► ProjectHistory UI
```

## Share links

A share link packs one brand into the URL hash so nothing is uploaded: `#share=1.<crc32 of JSON>.<deflate-raw JSON as base64url>`. Encoding and checks live in `lib/projects/share.ts` (`createShareLink`, `readShareToken`, `shareToken`). Copying uses `components/projects/copy-share-link.ts`. Opening a link is handled by `components/projects/share-link-import.tsx` (lazy-mounted as `LazyShareLinkImport` from the studio layout). Confirming calls `importSharedProject` in `lib/projects/actions.ts`, which adds a **new** project and never overwrites the open one. Long links drop uploaded logos (`MAX_SHARE_LENGTH`); the payload is validated like an imported `.designhub.json` file (including SVG sanitization).

**Persists in:** nowhere on a server. The brand travels only in the hash. After import it becomes a normal row in the `projects` table. History is not part of the link.

```
BrandSnapshot ──► createShareLink ──► clipboard URL (#share=…)
                                              │
                         open /brand#share=… ──┤
                                              ▼
                                    readShareToken (crc + inflate + parse)
                                              │
                                              ▼
                                    ShareLinkImport dialog
                                              │
                                              ▼
                                    importSharedProject ──► projects table
```

## End-to-end tests

Playwright smoke tests live in `tests/e2e/` (`routes.spec.ts`). Config is `playwright.config.ts`: it serves the production build with `pnpm start` on port 3100 (`E2E_PORT` to change it). The suite opens `/` and every studio from `lib/navigation.ts`, asserts a non-empty `h1`, fails on page or console errors, clicks a tab when present, checks the not-found page, and walks every `g` shortcut. CI runs them in `.github/workflows/e2e.yml` after `pnpm build`. Locally: `pnpm exec playwright install chromium`, then `pnpm build && pnpm test:e2e`. Vitest only picks up `lib/**/*.test.ts`, so these specs never run under `pnpm test`.

**Persists in:** nothing in the app. Failures keep a trace under `test-results/` (gitignored).

```
pnpm build ──► pnpm start (:3100) ──► playwright test (tests/e2e/)
                                            │
                                            ├── each route: 200, h1, no errors
                                            ├── unknown route: 404
                                            └── g <shortcut> → studio URL
                                            │
                                            ▼
                               CI: ci.yml, the E2E job (Chromium, 3 shards) / local: pnpm test:e2e
```
