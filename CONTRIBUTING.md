# Contributing to DesignHub

Thanks for helping build DesignHub! This guide covers everything from your first clone to a merged pull request. New here? [Your first contribution](docs/first-contribution.md) walks through one real change, adding a social template, from fork to merged pull request. By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** - open an issue with steps to reproduce, what you expected and what happened.
- **Suggest a feature** - open an issue describing the problem first; solutions are easier to agree on once the problem is clear.
- **Improve the docs** - typos, missing explanations and better examples are always welcome.
- **Write code** - look for issues labelled `good first issue` or `help wanted`, or pick something from the [roadmap](ROADMAP.md).

For larger changes (a new studio, a new export format, a new dependency) please open an issue or discussion before you start, so we can agree on the approach.

## Development setup

Requirements:

- Node.js **22 or newer** (`.nvmrc` is provided - run `nvm use`)
- pnpm **11** (pinned via the `packageManager` field - run `corepack enable`)

```bash
git clone https://github.com/<your-username>/DesignHub.git
cd DesignHub
pnpm install
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000). There is no backend and no API key (the optional Brand DNA AI provider uses a key each person pastes in the app, and tests never need one). The only environment variable, `NEXT_PUBLIC_SITE_URL`, is optional; see `.env.example`.

### pnpm commands

| Command              | What it does                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev`           | Start the dev server with hot reload                                                           |
| `pnpm build`         | Production build (must pass before merging)                                                    |
| `pnpm start`         | Serve the production build locally                                                             |
| `pnpm lint`          | ESLint (Next.js + TypeScript rules); any warning fails it, like an error                       |
| `pnpm typecheck`     | `tsc --noEmit` in strict mode                                                                  |
| `pnpm test`          | Unit tests with Vitest (`lib/**` and `packages/*/src/**`)                                      |
| `pnpm test:e2e`      | Playwright tests against the production build: routes, flows, axe (see below)                  |
| `pnpm format`        | Format all files with Prettier                                                                 |
| `pnpm format:check`  | Verify formatting without writing                                                              |
| `pnpm fonts:catalog` | Regenerate the font catalog (`catalog-index.json` and `catalog/`) from Google Fonts            |
| `pnpm check:unused`  | Fail on unused files, exports and dependencies (knip, also in CI)                              |
| `pnpm check:dashes`  | Fail if any file contains an em dash (also runs in CI)                                         |
| `pnpm bundle:size`   | Report each route's first-load JS after a build ([bundle budget guide](docs/bundle-budget.md)) |

Before pushing, run the same checks as CI:

```bash
pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build
```

CI (`.github/workflows/ci.yml`, `lint.yml`, `typecheck.yml` and `em-dash.yml`) runs these on every push and pull request with Node 22.

### End-to-end smoke tests

`e2e.yml` runs [Playwright](https://playwright.dev) on every pull request and push to `main`. `tests/e2e/routes.spec.ts` opens the home page and every studio from `lib/navigation.ts` in Chromium and fails on a page error, a console error or a missing main heading. It also opens a tab in each studio and checks every `g` shortcut. A new studio added to `lib/navigation.ts` is covered automatically.

To run it locally:

```bash
pnpm exec playwright install chromium   # once
pnpm build
pnpm test:e2e
```

A test that fails and then passes on its retry (CI retries once) still passes the job, but the job summary lists it under "End-to-end tests that needed a retry" with a warning on the file, and it is a test to fix. To find a flaky test, run `pnpm exec playwright test --repeat-each=10 --workers=8`: load makes real races show up. Wait for what the test needs (an element, a URL, a stored value), never for a fixed time, and give a first visit to a studio, which downloads its code, a generous timeout.

The config starts `pnpm start` on port 3100 (set `E2E_PORT` to change it) and reuses a server already running there. Failed runs keep a trace in `test-results/` (gitignored); open it with `pnpm exec playwright show-trace <trace.zip>`. Vitest only reads `lib/**/*.test.ts`, so the e2e specs never run under `pnpm test`.

`e2e-repeat.yml` runs every test five times with no retries each night (and by hand from the Actions tab, with the number of runs as an input) and lists in the job summary the tests that failed a run, as "2 of 5". It is not required and does not run on pull requests; fix what it names. Locally: `pnpm exec playwright test --repeat-each=5 --retries=0`. Both workflows also list the ten slowest tests in the job summary, and the nightly run uploads every test's time as the `e2e-durations` artifact, so a test that has doubled is seen; slowness never fails a run.

A store is written to IndexedDB a moment after it changes, and the browser Playwright installs can be slower at it. A test that changes a store (a filter, a folded panel, a chosen format) and then reloads or leaves the page must wait for the write first, with `saved(page, key, text)` from `tests/e2e/storage.ts`: `await saved(page, "designhub:panels", "storage-projects")`. The key is the store's `name`, and `text` is something the saved value contains once the change is in. Do not use `waitForTimeout` for this, and do not copy the helper into a spec. A test that reloads a page it only read needs none of this.

### Simple and Advanced mode

Adding a studio to Simple and Advanced mode, or moving a control between the modes, means editing the table of controls in [docs/simple-and-advanced.md](docs/simple-and-advanced.md). `tests/e2e/modes-table.spec.ts` reads it, opens each page in both modes and fails, naming the row, when the page and the table disagree.

### Screenshots

`tests/e2e/visual.spec.ts` takes screenshots of the home page, the Color Studio, the Effects Lab, the Background Studio, the Logo Studio and the Brand Studio at 375, 768 and 1280 px in light and dark, and of the phone pane bar with each pane of the Effects Lab open, and of each studio in the Simple and Advanced mode guide's table in each mode at 1280 px (the pages are read from that table, so a studio added there is covered with no other change), and fails when one no longer matches, so a layout that looks wrong is caught even when every behaviour test passes. They run only in `visual.yml`, on its Linux image, because other machines draw text a little differently (the images are stored in `tests/e2e/__screenshots__`, not named by platform). After a layout change you meant to make, open **Actions, Visual, Run workflow** with "update" ticked: it makes the screenshots again and commits them, and you read the new images in that commit. Locally, `VISUAL=1 pnpm exec playwright test tests/e2e/visual.spec.ts` compares them, which only passes on the same image.

### Lighthouse

The [performance guide](docs/performance.md) explains how to run and read each performance tool on your own machine (Lighthouse, bundle size, unused code, long tasks in the end-to-end tests and the autosave counters). This section and the next two cover what CI checks.

`lighthouse.yml` builds the app and runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) on the home page, `/brand`, `/colors`, `/typography` and `/social` for every pull request and push to `main`. Each page is audited five times and the median run is checked. Accessibility, best practices and SEO must score 100 everywhere. Performance must score 90 on the home page (below that fails the check); on the studios it is a warning, because CI runners are noisy and a studio is a much larger page. The scores of each page are in the job summary. The thresholds live in `lighthouserc.json`, and the HTML reports are uploaded as the `lighthouse-reports` artifact.

To run it locally (it needs Chrome, and nothing else running on port 3000):

```bash
pnpm build
pnpm dlx @lhci/cli autorun
```

It starts `pnpm start` itself, stops it when done and writes the reports to `.lighthouseci/` (gitignored). Open the `.html` files there to see what failed.

### Bundle size

`bundle-size.yml` builds the pull request and its base branch, then runs `scripts/bundle-size.mjs` to compare the first-load client JS of every route. The table of sizes and changes appears in the job summary, and the check fails if any route grows by more than 10% (gzipped). Next.js 16 no longer prints these sizes in `next build`, so the script reads them from the build output: the shared runtime in `.next/build-manifest.json` plus each page's entry chunks from its client reference manifest.

To run it locally, build, save a baseline, make your change, build again and compare:

```bash
git switch main && pnpm build && pnpm bundle:size --json bundle-size-main.json
git switch my-branch && pnpm build && pnpm bundle:size --base bundle-size-main.json
```

`--threshold <percent>` changes the limit and `--dir <path>` measures another checkout's `.next` folder. `bundle-size*.json` files are gitignored.

Every route also has an absolute budget in `bundle-budget.json` (gzipped kB, a little above the size on `main`), and `pnpm bundle:size` fails when a route is over it. Before raising a limit, follow the [bundle budget guide](docs/bundle-budget.md): find the module that grew, load it on demand or replace it. Raise a limit only in a reviewed change, with the reason in the pull request. A change that makes a route smaller is a good time to lower its limit.

### Unused code

`pnpm check:unused` runs [knip](https://knip.dev) and fails on a file, an export or a dependency nothing uses. Delete it, or, if it is used in a way knip cannot see, add it to `knip.json` with the reason in the pull request. `components/ui/**` (the shadcn primitives) and the few dependencies the build tools load by name (`tw-animate-css`, `tailwindcss`, `eslint-config-next`) are the existing exceptions.

## Branch naming

Create a branch from `main` using a type prefix and a short, kebab-case description:

| Prefix      | Use for                              | Example                   |
| ----------- | ------------------------------------ | ------------------------- |
| `feat/`     | New features                         | `feat/figma-token-export` |
| `fix/`      | Bug fixes                            | `fix/gradient-stop-drag`  |
| `docs/`     | Documentation only                   | `docs/token-format`       |
| `perf/`     | Performance work                     | `perf/lazy-icon-grid`     |
| `refactor/` | Code changes with no behavior change | `refactor/color-engine`   |
| `chore/`    | Tooling, dependencies, CI            | `chore/update-next`       |

## Commit style

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <summary in the imperative mood>
```

- Types: `feat`, `fix`, `docs`, `perf`, `refactor`, `test`, `chore`, `style`
- Scopes (optional): `brand`, `logo`, `mockups`, `social`, `guidelines`, `projects`, `typography`, `colors`, `icons`, `export`, `ui`, `layout`
- Keep the summary under ~72 characters and don't end it with a period.
- Use the body to explain _why_ when the change isn't obvious.

Examples:

```
feat(colors): add APCA contrast mode
fix(icons): keep stroke width when flipping
docs: explain DTCG token output
```

## Pull request process

1. **Fork** the repository and create your branch from `main`.
2. Make focused changes - one feature or fix per pull request.
3. Make sure `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.
4. Test in **both dark and light themes** and at a **mobile width** (≈375px).
5. Check the change works with the **keyboard only**.
6. Update docs (README, `docs/`, `CHANGELOG.md`) when behavior changes.
7. Open the pull request and fill in the template: what changed, why, and screenshots for UI changes.
8. A maintainer will review. Please respond to feedback with new commits (don't force-push during review) - we squash or rebase on merge as appropriate.

## Code standards

### TypeScript

- Strict mode is on. **Never use `any`** - use `unknown` with a type guard, generics or precise types.
- Put shared types in `types/`. Keep module-local types next to their code.
- Prefer pure functions in `lib/` for logic (color math, token generation). They are easy to test and reuse.

### React & Next.js

- Default to **Server Components**. Add `"use client"` only for components that need state, effects or browser APIs.
- Keep components small (aim for **under ~200 lines**). Extract hooks into `hooks/` and logic into `lib/`.
- Prefer **composition over duplication** - reuse primitives from `components/ui`.
- Lazy-load heavy, non-critical UI with `next/dynamic`, and heavy libraries with `import()` at the point of use.
- State that should survive a reload goes in a Zustand store persisted with `indexedDbStorage` (`lib/db.ts`).
- **Never duplicate state.** Each value has one owner (colors in the color store, fonts in the typography store, radius and spacing in the tokens store, shadow in the effects store). Brand features read them through `useBrandTokens()` instead of copying them. If a new store defines part of the brand, add it to `lib/projects/snapshot.ts` so projects capture it.

### Styling & design

- Use Tailwind utility classes and the design tokens in `app/globals.css` (`bg-card`, `text-muted-foreground`, `border-border-strong`, …). Don't hard-code colors in components.
- Radius is 12px (`rounded-lg`), spacing follows an 8px rhythm, and motion stays within **150–200ms**.
- No glassmorphism. Keep it quiet, editorial and minimal.

### Accessibility

- Use semantic HTML (`button`, `nav`, `section`, headings in order).
- Everything must be operable with the keyboard, with visible focus.
- Give icon-only buttons an `aria-label`.
- Text must meet WCAG AA contrast (4.5:1, or 3:1 for large text) in both themes.
- Respect `prefers-reduced-motion`.

### Writing style

- **Never use em dashes**, in code, comments, UI copy, docs or data. Use normal punctuation instead: a comma or parentheses for an aside, a colon before an explanation, a period between two sentences, or a spaced hyphen for a label ("Acme - brand guidelines"). Ranges use a plain hyphen ("150-200ms").
- `pnpm check:dashes` lists every em dash with its file and line, and the Em dash workflow fails the pull request if one slips in.
- Keep UI copy short and in sentence case.

### Tests

- Logic in `lib/` is covered by [Vitest](https://vitest.dev). Put a `name.test.ts` file next to the module it tests and import it with the `@/` alias.
- Test pure functions directly. Anything that needs the DOM or a canvas is better checked in the browser.
- `pnpm test` runs once; `pnpm exec vitest` watches while you work.

### Comments

Write comments only when they add information the code can't express - the _why_, a non-obvious constraint, or a reference. Don't narrate what the code already says.

## The command line (`packages/cli`)

`packages/cli` is a pnpm workspace package (named `designhub`; the app itself is `designhub-app`). It reads an exported `.designhub.json` file and writes Export Engine formats to a folder, importing `lib/tokens` and `lib/projects` from the app instead of copying them, so a new export format shows up in the CLI with no CLI change. Build it with `pnpm --filter designhub build` (output in `packages/cli/dist`, gitignored); its tests live in `packages/cli/src` and run with `pnpm test`, and CI builds it and runs `--help`. Keep it free of runtime dependencies and its output deterministic. [docs/cli.md](docs/cli.md) documents it for users, with CI recipes; update it when a flag or an exit code changes.

## Adding a new export format

1. Add a module `lib/tokens/formats/<id>.ts` with a pure generator that takes `DesignTokens` and returns a string, and a `defineFormat({ id, label, filename, language, generate })` entry.
2. Add the entry to `tokenFormatDefinitions` in `lib/tokens/formats.ts`, and give the id a tier (and a deprecation note, if any) in `lib/tokens/tiers.ts`.
3. Add a test in `lib/tokens/formats.test.ts` (use `lib/test/xml.ts` for XML formats). The CLI and the all-formats ZIP pick the format up automatically.
4. Verify the output is valid by pasting it into a real project.

Every format is also pinned byte for byte in `lib/tokens/__snapshots__`: after adding one, run `pnpm vitest run lib/tokens -u` and read the new files. The full walkthrough, with a worked example, the naming helpers, light and dark roles and the tests, is in [docs/export-formats.md](docs/export-formats.md).

## Adding data (palettes, icons, fonts, presets)

A lot of DesignHub is curated data, and adding to it is a great first contribution. Keep each entry high quality rather than adding many.

| Data                 | File                                            | Notes                                                                                                                                    |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Palette presets      | `lib/color/presets.ts`                          | Five 6-digit hex colors, a unique name and one or two tags from `paletteTags`.                                                           |
| Icon topics          | `lib/icons/topics.ts`                           | `prefix:name` ids. Check each one exists: `https://api.iconify.design/<prefix>.json?icons=<names>`.                                      |
| Font pairings        | `lib/typography/pairing.ts`                     | Both families must be in the font catalog (`lib/typography/catalog/`). Add a short note on the mood.                                     |
| Font catalog         | `lib/typography/catalog-index.json`, `catalog/` | Generated: an index and one details file per category. Run `pnpm fonts:catalog [limit]` (default 1,000) instead of editing them by hand. |
| Shadow presets       | `lib/effects/shadow.ts`                         | Build layers with `createLayer` or `smoothShadow`. They also appear in Brand Studio.                                                     |
| Social banner styles | `lib/social/templates/github/`                  | See "Mockup and social template guidelines" above.                                                                                       |

## Adding a background generator

Background generators live in `lib/background/generators/` and are pure functions of `BackgroundSettings`.

0. Several looks that share the same controls are one generator with variants (`backgroundFamily` in `lib/background/family.ts`, as Concentric, Woven and Zigzag do); a removed kind needs an alias in `lib/background/aliases.ts` so saved backgrounds still open.
1. Create `lib/background/generators/<name>.ts` exporting a `BackgroundDefinition` (`kind`, `label`, `description`, `render`, optional `css` and `defaults`), and add the kind to `BackgroundKind` in `types/background.ts`.
2. **Be deterministic.** Take all randomness from `createRandom(settings.seed)`, never `Math.random()`. The same seed must always draw the same background.
3. Map the shared controls consistently: `density` → how much (layers, points, spacing), `scale` → how big, `colors` → foreground palette, `background` → canvas color.
4. Return the drawing through `wrapSvg(settings, body, defs)` (or `patternSvg` for tiles). Rotation and cover scaling are handled there.
5. Provide `css()` when the look can be expressed with native CSS gradients; otherwise the exporter falls back to an inline SVG data URI.
6. Register it in `lib/background/registry.ts`. If it needs Paper.js, set `usesPaper: true`, call `getPaper()` inside `render`, and keep a fallback for when it hasn't loaded yet (and for server rendering).
7. Keep output compact: round coordinates with `r1()` and avoid thousands of nodes where a `<pattern>` would do.

## Adding an effect

1. Add the settings type to `EffectSettingsMap` in `types/effects.ts` and its defaults to `lib/effects/defaults.ts`.
2. Create `lib/effects/<name>.ts` with `defineEffect({ kind, label, description, generate })`. `generate` returns `declarations` (property/value pairs), plus optional `extra` (selector-scoped rules such as `::after`), `global` (top-level `@property` / `@keyframes`), `surface` and `needsFill` for the preview. An effect that builds on another studio's state (gradient text uses the Color Studio gradient) reads it from the optional second argument, `context`, instead of copying it into its settings.
3. Add a controls component in `components/effects/` and register it in `components/effects/controls-map.tsx`.
4. Every effect automatically gets CSS, Tailwind classes, `@utility`, SCSS and React output, so keep declarations framework-neutral and respect `prefers-reduced-motion` for anything animated.

## Adding a Brand Guidelines page

A Brand Guidelines page is one function that returns an SVG, registered in `lib/guidelines/registry.ts`. The [Guidelines page guide](docs/guidelines-pages.md) explains how a page is built, how numbering, PDF bookmarks and the website export work, walks through the Spacing & Layout page, and lists the tests to update.

## Translating the interface

DesignHub stores UI translations in `lib/i18n/messages/`. English is the source of truth, in `en-core.ts` and the `en-<area>.ts` files of the bigger studios (joined by `en.ts` for types); other locales may be incomplete, and missing keys fall back to English. Supported locales currently include English, Spanish (`es`), French (`fr`) and Hindi (`hi`).

To improve an existing translation or add a new language, follow the [Translation Guide](docs/translating.md). It explains how to edit catalogs, preserve keys and placeholders, register a locale, check fonts and text overflow, and test your changes.

The language switcher lets users choose a locale. The choice is saved in `localStorage` as `designhub:locale`; otherwise, the browser's first language with a translation is used. URLs do not change with the selected language.

Translation changes should preserve the existing message keys and placeholders. Run `pnpm test` and `pnpm check:dashes` before submitting your contribution.

### Using messages in a component

- In a Client Component, `const { t, plural } = useI18n()` from `components/layout/locale-provider.tsx`. `t("projects.card.rename", { name })` fills `{name}` placeholders; `plural("projects.toast.exported", count)` picks `<key>.one` or `<key>.other` and fills `{count}`.
- In a Server Component, render `<Message id="nav.home" />` (`components/layout/message.tsx`) for messages without placeholders.
- Keys and placeholders are type-checked: an unknown key or a missing placeholder is a compile error.
- To translate an error thrown in `lib/`, throw `new LocalizedError("error.…")` (`lib/i18n/errors.ts`) and show it with `errorMessage(error, t, fallbackKey)`. Its `message` stays English.
- New text goes into the English part its prefix belongs to (`en-core.ts`, or `en-icons.ts`, `en-logo.ts`, `en-mockups.ts`, `en-social.ts`, `en-svg.ts` for those studios) first (sentence case, no em dashes), then into the other catalogs when you can.

### Adding a locale

1. Create `lib/i18n/messages/<code>.ts` exporting `{ ... } satisfies Catalog`, using a two-letter language code such as `fr`. Copy keys from the English parts and translate them; keep every `{placeholder}` and skip any key you are unsure of.
2. Register it in `lib/i18n/locales.ts`: add the code to `locales`, the catalog to `catalogs` and its name, written in that language, to `localeNames`.
3. Run `pnpm test`: `lib/i18n/messages.test.ts` checks that every key exists in English, that placeholders match and that no message contains an em dash.
4. Pick the language in the header switcher and check the shell and Brand Projects at a mobile width, where longer words can wrap.
5. Inter and Space Grotesk only cover Latin scripts. For another script, add system fonts that cover it to `--font-sans` and `--font-display` in `app/globals.css`, as Hindi does with Kohinoor and Noto Sans Devanagari.

## Component guidelines

- Start from the primitives in `components/ui` (Button, Input, Panel, Select, Switch, ToggleGroup, Dialog). Add a primitive there only when two studios need it.
- Studios use `StudioLayout` (controls, preview, output) and `SvgPreviewCanvas` for anything drawn as SVG, so zoom, backdrops and keyboard control come for free.
- Name files after what they render (`logo-variants.tsx`), one exported component per file, props typed inline or as `type Props`.
- Every interactive element needs a visible label or an `aria-label`. Radio-style pickers use `role="radiogroup"` and `aria-checked`, and attach `useRovingRadio()` to their container so the group is one tab stop with arrow-key, Home and End navigation.
- Keep side effects in hooks (`hooks/`), keep rendering pure, and keep heavy work (rasterizing, PDF, ZIP) behind a button with a loading state.

## Mockup and social template guidelines

For a full walkthrough of a mockup template, see [docs/mockup-templates.md](docs/mockup-templates.md). Social templates have their own guide: [docs/social-templates.md](docs/social-templates.md).

Mockups (`lib/mockups/templates/`), social assets (`lib/social/templates/`) and guideline pages (`lib/guidelines/pages/`) are pure functions from a drawing context to an SVG string.

1. Take every color, font, radius and logo from the context (`ctx.brand`, `ctx.surface`). Never hard-code brand values; neutral device colors (bezels, stands) are fine.
2. Wrap the drawing with `mockupDoc(ctx, width, height, body, defs)` so the brand fonts are embedded and the `.h` (heading), `.b` (body) and `.bb` (bold body) classes work in PNG and PDF exports.
3. Use the helpers in `lib/mockups/kit.ts`: `text()` escapes user copy, `logo()` nests the logo with namespaced ids, `wrap()` breaks lines with real font metrics, and `onPrimaryLarge()` picks a readable color for large text on the primary color.
4. Give every copy of the logo in one drawing a unique id prefix, or gradients inside it will collide.
5. Social templates declare their exact platform size, a `safe` rect and any `covered` zones (avatars, timestamps), and keep text inside the safe rect.
6. Register the template: add it to `lib/social/all.ts` or `lib/mockups/all.ts` (its position is its place in the picker), add a loader line to `loaders.ts` next to it, and run `pnpm vitest run lib/social lib/mockups -u` to write `template-info.json`, the light list the picker reads. The studio loads a template's code when it is chosen, so a test fails when the list, the loaders and the templates disagree. It then appears in the picker, the exports and the ZIP packs automatically.
   - To add a **style** to an existing asset (for example a new GitHub banner look), create a file in `lib/social/templates/github/` with `githubBanner("Name", "description", (ctx) => ({ body, defs }))` and add it to `lib/social/templates/github/index.ts`. Styles share a `group`, so they appear nested under that asset in the picker.
   - Read copy from `ctx.content` and spacing from `ctx.layout.padding`, and draw the background through `backdrop(ctx, W, H, own)` so the Background style setting works in your template too.
7. Check the result in light and dark, with a long brand name and headline, and with an uploaded non-square logo.

## SVG coding guidelines

These apply to generated SVG (backgrounds, icons, sprites) and to code that transforms user SVG.

- **Never inject untrusted SVG into the DOM.** Preview it through an `<img>` data URL (`svgToDataUrl`) or `SvgPreviewCanvas`. Converters and exports must go through `optimizeTree`, which always strips `<script>`, `<foreignObject>`, `on*` handlers and `javascript:` URLs.
- Always emit `xmlns="http://www.w3.org/2000/svg"` and a `viewBox`; add `width`/`height` only when a fixed intrinsic size is intended.
- Round numbers to the precision the output needs (1 decimal for backgrounds, the user's choice in the optimizer). Don't emit `-0`, trailing zeros or leading zeros (`.5`, not `0.5`, in path data).
- Prefer `<pattern>` for repeating tiles and shared `<defs>` for gradients and filters over duplicated geometry.
- Namespace ids when combining documents (sprites) and update every `url(#…)` / `href="#…"` reference with them. A bare `#abc` is only a reference in `href` attributes - elsewhere it's a color.
- Don't remove inherited presentation attributes (`stroke-width`, `fill-rule`, `fill-opacity`, …) as "defaults": a parent may set a different value.
- Test transformations against real files: compare renders before and after (the optimizer is verified pixel by pixel against Iconify and design-tool exports).

## Questions?

Open a [discussion](https://github.com/yakew7/DesignHub/discussions) or an issue. We're happy to help.
