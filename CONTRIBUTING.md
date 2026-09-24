# Contributing to DesignHub

Thanks for helping build DesignHub! This guide covers everything from your first clone to a merged pull request. By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

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

The app runs at [http://localhost:3000](http://localhost:3000). There is no backend and no API key. The only environment variable, `NEXT_PUBLIC_SITE_URL`, is optional; see `.env.example`.

### pnpm commands

| Command              | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `pnpm dev`           | Start the dev server with hot reload                                |
| `pnpm build`         | Production build (must pass before merging)                         |
| `pnpm start`         | Serve the production build locally                                  |
| `pnpm lint`          | ESLint (Next.js + TypeScript rules)                                 |
| `pnpm typecheck`     | `tsc --noEmit` in strict mode                                       |
| `pnpm format`        | Format all files with Prettier                                      |
| `pnpm format:check`  | Verify formatting without writing                                   |
| `pnpm fonts:catalog` | Regenerate `lib/typography/catalog.json` from Google Fonts metadata |

Before pushing, run the same checks as CI:

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
```

CI (`.github/workflows/ci.yml`, `lint.yml`, `typecheck.yml`) runs these on every push and pull request with Node 22.

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

### Comments

Write comments only when they add information the code can't express - the _why_, a non-obvious constraint, or a reference. Don't narrate what the code already says.

## Adding a new export format

1. Write a pure generator in `lib/tokens/formats.ts` that takes `DesignTokens` and returns a string.
2. Register it in `tokenFormats()` with an `id`, `label`, `filename` and `language`.
3. Verify the output is valid by pasting it into a real project.

## Adding a background generator

Background generators live in `lib/background/generators/` and are pure functions of `BackgroundSettings`.

1. Create `lib/background/generators/<name>.ts` exporting a `BackgroundDefinition` (`kind`, `label`, `description`, `render`, optional `css` and `defaults`), and add the kind to `BackgroundKind` in `types/background.ts`.
2. **Be deterministic.** Take all randomness from `createRandom(settings.seed)`, never `Math.random()`. The same seed must always draw the same background.
3. Map the shared controls consistently: `density` → how much (layers, points, spacing), `scale` → how big, `colors` → foreground palette, `background` → canvas color.
4. Return the drawing through `wrapSvg(settings, body, defs)` (or `patternSvg` for tiles). Rotation and cover scaling are handled there.
5. Provide `css()` when the look can be expressed with native CSS gradients; otherwise the exporter falls back to an inline SVG data URI.
6. Register it in `lib/background/registry.ts`. If it needs Paper.js, set `usesPaper: true`, call `getPaper()` inside `render`, and keep a fallback for when it hasn't loaded yet (and for server rendering).
7. Keep output compact: round coordinates with `r1()` and avoid thousands of nodes where a `<pattern>` would do.

## Adding an effect

1. Add the settings type to `EffectSettingsMap` in `types/effects.ts` and its defaults to `lib/effects/defaults.ts`.
2. Create `lib/effects/<name>.ts` with `defineEffect({ kind, label, description, generate })`. `generate` returns `declarations` (property/value pairs), plus optional `extra` (selector-scoped rules such as `::after`), `global` (top-level `@property` / `@keyframes`), `surface` and `needsFill` for the preview.
3. Add a controls component in `components/effects/` and register it in `components/effects/controls-map.tsx`.
4. Every effect automatically gets CSS, Tailwind classes, `@utility`, SCSS and React output, so keep declarations framework-neutral and respect `prefers-reduced-motion` for anything animated.

## Component guidelines

- Start from the primitives in `components/ui` (Button, Input, Panel, Select, Switch, ToggleGroup, Dialog). Add a primitive there only when two studios need it.
- Studios use `StudioLayout` (controls, preview, output) and `SvgPreviewCanvas` for anything drawn as SVG, so zoom, backdrops and keyboard control come for free.
- Name files after what they render (`logo-variants.tsx`), one exported component per file, props typed inline or as `type Props`.
- Every interactive element needs a visible label or an `aria-label`; radio-style pickers use `role="radiogroup"` and `aria-checked`.
- Keep side effects in hooks (`hooks/`), keep rendering pure, and keep heavy work (rasterizing, PDF, ZIP) behind a button with a loading state.

## Mockup and social template guidelines

Mockups (`lib/mockups/templates/`), social assets (`lib/social/templates/`) and guideline pages (`lib/guidelines/pages/`) are pure functions from a drawing context to an SVG string.

1. Take every color, font, radius and logo from the context (`ctx.brand`, `ctx.surface`). Never hard-code brand values; neutral device colors (bezels, stands) are fine.
2. Wrap the drawing with `mockupDoc(ctx, width, height, body, defs)` so the brand fonts are embedded and the `.h` (heading), `.b` (body) and `.bb` (bold body) classes work in PNG and PDF exports.
3. Use the helpers in `lib/mockups/kit.ts`: `text()` escapes user copy, `logo()` nests the logo with namespaced ids, `wrap()` breaks lines with real font metrics, and `onPrimaryLarge()` picks a readable color for large text on the primary color.
4. Give every copy of the logo in one drawing a unique id prefix, or gradients inside it will collide.
5. Social templates declare their exact platform size, a `safe` rect and any `covered` zones (avatars, timestamps), and keep text inside the safe rect.
6. Register the template in its `registry.ts`. It then appears in the picker, the exports and the ZIP packs automatically.
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
