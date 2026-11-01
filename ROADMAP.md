# Roadmap

DesignHub 1.0.0 shipped seventeen studios. The next major version, 2.0.0, is about making them fewer, better and fully tested rather than adding more. The three groups below were the build order of 1.0.0, not separate versions.

DesignHub grows one studio at a time. Every studio follows the same principles: open source, local first, no login, no backend, offline first, keyboard first and production ready.

Have an idea, or want to help build something here? Open an issue or discussion - see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Shipped in 1.0.0: Foundations ✅

### Typography

- Google Fonts browser, search, categories, favorites and recents
- Variable font playground and OpenType controls
- Font pairing engine
- Fluid type scale, `clamp()` generator and responsive preview
- Exports: CSS, Tailwind, SCSS, React, JSON tokens

### Colors

- Palette generator with locks and harmony modes
- OKLCH editor with HEX / RGB / HSL / OKLCH
- Shade generator (50–950) and gradient builder (linear, radial, conic)
- WCAG contrast checker and color blindness preview
- Exports: CSS variables, Tailwind, JSON tokens, SVG gradient

### Icons

- Iconify search and collections
- SVG editing: stroke, corners, color, rotate, flip
- SVG, React, PNG and ICO exports
- Favicon generator

### Export

- Shared design-token system
- CSS variables, SCSS, Tailwind config, React theme, JSON tokens
- One-click copy, JSON download and live preview

---

## Shipped in 1.0.0: Surfaces, effects, SVG & accessibility ✅

### Background Studio

- Waves, blobs, mesh gradients, aurora, noise textures, dot, grid and isometric patterns, plus rings, checks, low poly, bokeh, confetti, chevron, hexagons and sunburst
- Seeds, randomize, color, density, scale and rotation controls
- SVG, PNG and CSS exports

### Effects Lab

- Glassmorphism, neumorphism, layered shadows, glows, gradient and animated borders, grain
- CSS, Tailwind classes, Tailwind `@utility`, SCSS and React exports
- Shadow and blur tokens in the Export Engine

### SVG Playground

- Upload, drag and drop, preview, viewBox, fill and stroke editing
- Path and group inspector
- Optimization, minify and pretty print
- SVG → JSX, React and React Native; sprite generator

### Accessibility Lab

- WCAG contrast checker with fixes
- Color vision simulation (protanopia, deuteranopia, tritanopia, grayscale, low vision)
- Readability, dyslexia preview and touch-target validation
- JSON accessibility report

---

## Shipped in 1.0.0: Brand platform ✅

### Brand Studio

- One brand hub: name, logo, colors with roles, fonts, radius, spacing and shadow
- Synchronized brand tokens with no duplicated state, and a live light and dark preview

### Logo Studio

- SVG editor, construction grid, clear space and safe area
- Monochrome, inverted, horizontal, stacked, wordmark and app icon variants, minimum size and background tests
- SVG, PNG, PDF and a logo pack ZIP

### Mockup Studio

- Business card, letterhead, envelope, stickers and poster
- Landing page on a laptop, desktop dashboard and mobile app screens
- High-resolution PNG and PDF, in light and dark

### Social Media Studio

- GitHub, LinkedIn, X, Instagram (square and story), Open Graph, Product Hunt and YouTube templates
- Platform presets and safe areas, PNG export and a social asset ZIP

### Brand Guidelines

- An automatic brand book from cover to design token appendix, exported as PDF

### Brand Projects

- Local projects with autosave, favorites, duplicate, and JSON import and export

### Brand DNA (architecture)

- Image upload, extraction UI, loading states and editable results
- A provider interface with an on-device provider and a mock AI provider

---

## 2.0.0 - Quality and consolidation 🎯

**Goal:** fewer, better and fully tested studios. DesignHub stays local first, with no login and no backend. No AI is used unless a person pastes their own key, and nothing in the app calls a model without one.

Done so far on the way to calmer and faster (see also [Simple and Advanced mode](docs/simple-and-advanced.md)): the short home page and command palette, folding sidebar groups and panels, grouped and searchable pickers, Simple and Advanced mode, one pane at a time on phones, a size budget for every route, an unused code check, and the performance work (on-demand token formats, a split font catalog, on-demand templates, a worker for the heavy backgrounds, autosave that writes only changes a lighter offline install, windowed icon and project lists, versions stored as changes, the active language only, a Storage panel a Lighthouse gate on the home page, a collapsible sidebar, selecting several projects, arrow keys in the icon grid a real-browser test of a service worker update, an offline marker, swiping between panes, trimming old versions and a Simple and Advanced guide that is checked against the pages).

Follow the work by label: [issues labelled `v2.0.0`](https://github.com/yakew7/DesignHub/issues?q=is%3Aopen+label%3Av2.0.0).

### Reduce

- **Niche social templates**: keep about 20 core platforms (GitHub, LinkedIn, X, YouTube, Instagram, Open Graph, Product Hunt, Facebook, Bluesky, Discord, Twitch, Mastodon, Medium, Substack, DEV, Hashnode, Pinterest, Notion, Reddit, Telegram) and move the rest (Kick, Bandcamp, Etsy, Gumroad, Ko-fi, Tumblr, Patreon, Behance, Dribbble and similar) into a data-driven "more templates" group that the community owns.
- **Overlapping backgrounds**: merge near-duplicates into one generator with a variant control (rings, concentric arcs and squares; argyle, plaid and checks; zigzag, chevron and squiggle), taking 39 generators to about 28 without losing a look.
- **Duplicated framework converters**: one shared SVG-to-component converter module, shown in both the SVG Playground and Icon Studio.
- **Token formats in tiers**: Core (CSS, SCSS, Tailwind, JS, JSON DTCG, Style Dictionary, Figma), Frameworks and Platforms. The least used are deprecated in 2.0 and removed in 2.1. New niche format requests are declined.
- **Mockups**: about 14, with the object mockups (cup, bag, billboard, lock screen) folded into fewer parameterized templates.
- **Dependencies**: replace the lazily loaded `@anthropic-ai/sdk` with a small `fetch` client in Brand DNA, so the bring-your-own-key providers share one request path, and audit the rest.

### Add (quality only)

- **Project file schema v2**: a versioned `.designhub.json`, IndexedDB schema and share-link format, with migrations from v1 and fixture-based migration tests. This is the breaking change that makes it 2.0.
- **Extension points**: formats, generators, templates and mockups become small typed modules on one registry shape with one test harness each, and `lib/tokens/formats.ts` is split. This prepares a plugin system without shipping one.
- **Test depth**: golden-file snapshot tests for every generator, template, mockup and format, component tests for the stores and flows, end to end flow tests (brand to export, import and export a project, offline, keyboard only) and coverage thresholds in CI.
- **Full translations**: every studio in en, es, fr and hi, a CI check that fails on a missing key in any language, and right-to-left support proved with one RTL language.
- **Accessibility and UX polish**: axe checks in the end to end tests for every studio, a mobile pass on the dense studios, a reduced-motion audit, and one empty state, undo and error pattern.
- **Export trust**: exports that match their previews (embedded fonts included), bounded PDF, PNG and ZIP sizes, an adversarial corpus for the SVG sanitizer, and the CLI published to npm with the app's output.
- **Docs**: a v1 to v2 migration guide, a "which studio do I need" page and a first-run tour.

### AI policy

- No AI by default. Brand DNA's opt-in provider uses a key the person pastes, shows the exact payload before the first request and falls back to the on-device result.
- The model becomes a setting, and an OpenAI-compatible endpoint option (which also covers local models such as Ollama) joins the key panel.
- A test and an end to end check keep the app from making any network request without a key. Brand DNA stays beta until it is shown to work across a test set of images.

### Phases

| Phase         | Contents                                                                                                               | Exit                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `2.0.0-alpha` | Schema v2 and migrations, the registry refactor, the prune and merge, the dependency cleanup.                          | The pruned build passes every gate.                   |
| `2.0.0-beta`  | Snapshot, component and end to end tests, full translations, the accessibility pass, verified exports, the CLI on npm. | Coverage gates are green, every language is complete. |
| `2.0.0-rc`    | Feature freeze, the migration guide, a bug bash, Lighthouse and bundle budgets held.                                   | Two weeks with no blocker issues.                     |
| `2.0.0`       | The release, with a deprecation list for 2.1.                                                                          | The release checklist below.                          |

### Release checklist

- `pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build` pass.
- v1 projects, share links and IndexedDB data migrate with no loss.
- No missing translation key in any language, and axe finds no violation in any studio.
- Lighthouse stays at 100 for accessibility, best practices and SEO and at 95 or more for performance.
- No network request is made without a person's own key.

---

## After 2.0 🔭

### Plugin Marketplace

- Community studios, generators and export formats installed from a registry, sandboxed and local first

### Desktop App

- A native wrapper with file system access, system fonts and offline installers

### AI Brand DNA

- ✅ A model-backed Brand DNA provider behind the existing interface, opt-in and bring-your-own-key (the Anthropic Messages API)
- Support more vision providers behind the same key panel

### Team Collaboration

- Share brand projects, comment on guideline pages and sync changes, without giving up local-first storage

---

The plugin marketplace, the desktop app and team collaboration wait until after 2.0: collaboration conflicts with local-first storage, and a marketplace needs a sandbox design first. Folder sync already covers sharing through Git. Items are ordered by priority but not by date. Scope may change based on community feedback.
