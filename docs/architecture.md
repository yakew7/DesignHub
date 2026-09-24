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

A second Dexie table (`icons`) caches Iconify glyph bodies, which is why icons you have opened keep working offline. A third (`projects`, schema v3) stores brand projects. Every Dexie call goes through `safeDb`, which times out and falls back to memory, so blocked storage never breaks a studio.

## Brand architecture

The brand never duplicates state. `brand-store` keeps only what is unique to the brand (name, description, uploaded logo, color roles, voice). Everything else has one owner: colors in `color-store`, fonts and scale in `typography-store`, radius and spacing in `tokens-store`, shadow in `effects-store`. `useBrandTokens()` (`hooks/use-brand.ts`) composes them into `BrandTokens` on every render, so an edit in any studio updates the brand everywhere.

From there:

- `lib/brand/theme.ts` derives light and dark surfaces with guaranteed text contrast.
- `hooks/use-draw-context.ts` adds those surfaces, embedded font CSS and text measurement. Mockups, social assets and guideline pages are pure functions of this context that return SVG (`lib/mockups`, `lib/social`, `lib/guidelines`).
- `lib/export/raster.ts` and `lib/export/pdf.ts` turn any of that SVG into PNG, JPEG or PDF; `lib/zip.ts` bundles packs.
- `lib/projects/snapshot.ts` lists every brand-defining store. A project is a snapshot of them; opening one writes the snapshot back into the live stores, and `ProjectAutosave` keeps the open project current.
- `lib/brand-dna` defines the `BrandDnaProvider` interface. Providers run in the browser and return editable results that are applied through the same stores.

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
- `lib/tokens/` - the shared `DesignTokens` model (`build.ts`), the format generators (`formats.ts`) and the PDF style guide (`pdf.ts`).
- `lib/zip.ts` - a dependency-free ZIP (store) writer used by every "download all" button.

## Color model

OKLCH is the source of truth for every color in the app. It is perceptually uniform, so shades, harmonies and gradients look evenly spaced. Values are converted to HEX / RGB / HSL only at the edges (display and export), with CSS Color 4 gamut mapping into sRGB.

## Fonts

`lib/typography/catalog.json` is generated from public Google Fonts metadata by `scripts/generate-font-catalog.mjs`, so the app needs no API key. It is loaded with a dynamic `import()` in its own chunk. Fonts are loaded on demand through the Google Fonts CSS API. Grid previews add `&text=` so only the rendered glyphs download.

## Performance notes

- The command palette and shortcuts dialog mount on first use (`components/layout/lazy-overlays.tsx`).
- Secondary tabs in each studio are loaded with `next/dynamic`.
- Heavy libraries are imported where they're used: OpenType.js (font inspector), pdf-lib (style guide, brand book, mockup PDF) and html-to-image (snapshots).
- Brand assets in the Export Engine and project autosave load after hydration with `next/dynamic`.
- Color.js uses its tree-shakable `colorjs.io/fn` entry with only the spaces we need registered.
- Third-party SVG is rendered through `<img>` data URLs, never injected into the DOM.
