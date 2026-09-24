# Changelog

All notable changes to DesignHub are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.0.0

Released 2026-09-23. The first public release: a complete, local-first design and brand identity toolkit with seventeen studios.

### Added

#### Platform

- Next.js 15 App Router app with strict TypeScript, Tailwind CSS v4 and shadcn/ui primitives.
- DesignHub design system: dark-first editorial theme with a light mode, Inter and Space Grotesk, 12px radius, 8px spacing rhythm and 150–200ms motion.
- Responsive app shell with a studio sidebar grouped into Brand, Design and Tools, a header nav and a mobile navigation sheet.
- Dark and light themes that follow the system preference, toggled with `⌥T`.
- Command palette (`⌘K` or `/`) that searches studios, actions, Google Fonts and Iconify.
- Keyboard navigation (`G` then `H`/`R`/`D`/`L`/`M`/`O`/`U`/`P`/`T`/`C`/`I`/`B`/`F`/`S`/`A`/`E`) and a shortcuts dialog (`?`).
- Toast notifications for copy, save and download actions.
- Local-first persistence: every studio saves to IndexedDB through a Dexie-backed Zustand storage adapter.
- Homepage with a hero, search bar, a card for every studio, principles section, GitHub call to action and footer.
- Resizable three-pane studio layout (controls · live preview · code and exports) with keyboard-operable dividers, stacking on small screens.
- Reusable SVG preview canvas with zoom, fit, 100%, backdrops, size and byte readouts.

#### Brand Studio

- The hub of the identity: name, description, logo, colors with roles, fonts, radius, spacing and shadow, edited in one place.
- A synchronized brand token system. The brand store holds only what is unique to the brand; colors, type, radius, spacing and shadows are read live from their own studios, so there is never a second copy.
- Live brand preview in light and dark with a UI kit, and a token panel that exports straight from the Export Engine.
- A geometric logo mark generated from the brand name until an SVG is uploaded (uploads are sanitized).

#### Brand DNA (beta)

- Upload a logo, product shot or moodboard and extract a weighted palette, mood, type pairing, radius and personality.
- Provider architecture: an on-device heuristic provider and a mock AI provider that returns sample data, both behind one interface, ready for a model-backed provider.
- Staged loading states, editable results and one-click apply to the brand with undo.

#### Logo Studio

- SVG logo editor: recolor every color in the mark, monochrome and inverted modes.
- Construction grid, clear space (adjustable) and safe area guides.
- Responsive variants: full color, monochrome, inverted, horizontal and stacked lockups, wordmark and app icon, with a minimum size strip and background tests.
- Logo pack export: every variant as SVG, PNG and PDF in one ZIP with usage notes.

#### Mockup Studio

- Business card, letterhead, envelope, stickers and poster print mockups.
- Landing page on a laptop, analytics dashboard on a desktop display and a three-screen mobile app.
- Drawn with SVG from the live brand tokens, in light and dark, with the brand fonts embedded.
- High-resolution PNG (up to 4×) and PDF export.

#### Social Media Studio

- GitHub repository banner gallery with fifteen styles (Minimal, Editorial, Aurora, Grid, Terminal, Glass, Gradient, Split, Bento, Spotlight, Classic, Launch, Showcase, Features, Badges), nested under a collapsible Repository banner row in the template list.
- LinkedIn cover, X header, Instagram square post and story, three Open Graph layouts, Product Hunt gallery image and YouTube thumbnail.
- A shared content panel under the preview: project name, description, website, GitHub username, logo upload, primary and secondary colors, background style, border radius and padding, applied to every template. Saved with brand projects.
- Platform presets with exact sizes, a safe area overlay and the zones covered by platform UI.
- Automatic logo, typography and colors, editable copy, Export PNG (plus @1x and @2x), SVG export, copy image to the clipboard, Open Graph meta tags and a ZIP of every asset.

#### Brand Guidelines

- A complete brand book generated from the brand: cover, introduction, logo usage, clear space, minimum size, incorrect usage, color palette, typography, iconography, UI components, accessibility, voice and tone, and a two-page design token appendix.
- Pages can be switched off; numbering and contents update automatically. Voice and tone are edited in place.
- Export the full book as a PDF with pdf-lib, or any page as PNG.

#### Brand Projects

- Keep several brands in the browser, each a snapshot of every brand-defining studio, stored in IndexedDB (Dexie v3 schema).
- Create, open, rename, duplicate, delete and favorite projects; last opened and last edited times; search and a favorites filter.
- The open project autosaves as you work in any studio.
- Import and export projects as JSON, one at a time or all at once, with validation and logo sanitizing on import.

#### Typography Studio

- Google Fonts browser with a bundled catalog of 1,000 families across sans serif, serif, display, handwriting and monospace (generated by `pnpm fonts:catalog`).
- One-screen browse layout: a scrolling font list (each name set in its own typeface, loading more as you scroll) beside a pinned specimen, with the controls scrolling underneath.
- Search, category filters, variable-only and favorites filters, and three sort orders.
- Favorite fonts and recent fonts.
- Editable specimen with weight, italic, size, line height and letter spacing controls.
- Variable font playground with a slider and an animation toggle for every axis.
- Font pairing engine with 42 curated pairs, rule-based suggestions, locked random pairing (`Space`) and saved pairs.
- Fluid type scale generator (separate min/max base and ratio) and a standalone `clamp()` generator.
- Responsive typography preview at device presets or any viewport width, plus a heading/body rhythm editor.
- OpenType controls for ligatures, small caps, figure styles, fractions, slashed zero and stylistic sets.
- Local font inspector (OpenType.js) that lists real feature tags and previews the font without uploading it.
- Typography exports: CSS, Tailwind v4, SCSS, React/TypeScript, JSON tokens and a Google Fonts embed.

#### Color Studio

- Palette generator with locks, reorder, add/remove, undo/redo (`Z` / `⇧Z`) and saved palettes.
- Palette library with 48 curated palettes in 12 moods; loading one can be undone.
- Harmony modes (analogous, complementary, split-complementary, triadic, tetradic, monochromatic) with a hue wheel.
- OKLCH editor with gradient channel sliders, HEX/RGB/HSL/OKLCH inputs and sRGB/P3 gamut badges.
- 50–950 shade generator in OKLCH with anchoring and hue shift, for every palette color.
- Gradient builder for linear, radial and conic gradients with draggable, keyboard-movable stops and a choice of interpolation space.
- WCAG 2.1 contrast checker with AA/AAA results, closest-passing color suggestions and a palette contrast matrix.
- Color blindness simulation (Machado 2009) for protanopia, deuteranopia, tritanopia and achromatopsia.
- Color exports: CSS variables, Tailwind v4, DTCG JSON tokens and SVG gradients.

#### Icon Studio

- Iconify search across 200,000+ icons, with collection browsing and license details.
- Favorites and an IndexedDB cache so icons you have opened keep working offline.
- Browse by topic: 240 curated icons in 10 themed packs, every id verified against Iconify, and one-click search suggestions.
- SVG editing: color, stroke width, rounded/sharp corners, rotate (`R`), flip, padding and background shapes.
- Favicon generator producing `favicon.ico`, `icon.svg`, Apple touch and PWA icons, `site.webmanifest` and HTML, bundled as a ZIP.
- Exports: SVG, React TSX component, CSS data URI, PNG (16-1024px) and ICO.
- Reliable loading: automatic fallback to Iconify mirror hosts, per-request timeouts, progressive batches, retry for failed icons and a clear error state. Icons render when IndexedDB is blocked, and exported SVG is valid XML in every browser.

#### Background Studio

- Sixteen procedural generators: waves, organic blobs (Paper.js smoothing), mesh gradients, aurora, noise textures, dot, grid and isometric patterns, concentric rings, checkerboard, low-poly mosaic, bokeh, confetti, chevron, honeycomb hexagons and sunburst.
- Deterministic seeds with randomize (`Space`), color controls with a "use palette" shortcut, density, scale, rotation and canvas presets.
- Exports: SVG, PNG (1× and 2×) and CSS backgrounds (native gradients where possible, inline SVG otherwise).

#### Effects Lab

- Glassmorphism, neumorphism, layered shadow (with smooth presets), glow, gradient and animated borders, and grain overlay generators.
- Live preview on gradient, photo, light and dark backdrops.
- Exports: CSS, Tailwind arbitrary-property classes, Tailwind v4 `@utility`, SCSS mixins and React style objects, plus an `effects.css` bundle.

#### SVG Playground

- Upload, drag and drop, paste or edit SVG source, with a script-safe preview.
- viewBox editor, element tree, path and group inspector (svg-path-parser) and fill/stroke editing per element or for every shape.
- Optimization engine built on svgson: metadata and editor-data removal, id cleanup, group collapsing, precision control, shortest path data, color shortening and always-on sanitizing; minify and pretty print.
- Converters: SVG → JSX, SVG → React component and SVG → React Native (react-native-svg).
- Sprite generator with namespaced symbol ids and usage snippets.

#### Accessibility Lab

- WCAG contrast checks for body text, links, button labels and non-text UI, with AA/AAA verdicts and one-click fixes.
- Vision simulation (protanopia, deuteranopia, tritanopia, grayscale, low vision) with perceived-contrast measurements.
- Readability analysis: font size, line height, characters per line measured in the real font, Flesch reading score.
- Dyslexia preview with spacing controls, a friendly preset and a reading simulation.
- Touch-target validation for WCAG 2.5.5 (44px) and 2.5.8 (24px + spacing).
- Downloadable JSON accessibility report.

#### Export Engine

- Shared design-token model assembled live from all studios, with semantic color roles.
- Configurable name, variable prefix, color notation, spacing base, radius base and included sections.
- Generators for CSS variables, SCSS, Tailwind v4 `@theme`, Tailwind v3 config, React theme and W3C DTCG JSON.
- Live preview UI kit, one-click copy, Download JSON, all formats as a ZIP, preview PNG (html-to-image) and a PDF style guide (pdf-lib).
- Effect tokens (`--shadow-card`, `--shadow-glow`, `--blur-glass`) in every format.
- Assets section with background CSS and SVG, the effects bundle, the optimized SVG and the accessibility JSON report.
- Vue 3 theme export (theme object, injection key, plugin and CSS variables) alongside the React theme.
- Brand assets section: Brand JSON, the brand guidelines PDF, the logo pack ZIP and the social asset ZIP, loaded on demand.

### Performance

- Lighthouse 100 for accessibility, best practices and SEO on every route, and 96–100 performance on mobile and desktop with real (DevTools) throttling.
- The command palette and shortcuts dialog load on first use, and secondary studio tabs are split into their own chunks.
- `optimizePackageImports` for Radix, Lucide, Framer Motion and Iconify: the homepage first-load JS dropped from 230 kB to 118 kB.
- Color.js' tree-shakable API with only the color spaces we use registered.
- Font previews request only the glyphs they display, and load when scrolled into view.
- Removed layout shifts in the Icon and Typography studios; the landing page animates with CSS only.
- Accessible names on every slider thumb and combobox, and token contrast raised to at least 4.5:1.
- Static metadata routes (sitemap, robots, web manifest) and baseline security headers.
- Vercel Web Analytics for anonymous, cookie-free page views on the hosted site. It loads only in Vercel builds, so self-hosted copies and local runs make no analytics requests.
- Every studio is its own route chunk; Paper.js loads only for Paper-based generators and stays out of the server bundle.
- The four new studios score 97–100 performance and 100 accessibility, best practices and SEO (Lighthouse, DevTools throttling and desktop).
- The SVG preview canvas waits for layout before painting, removing its layout shift.
- Every route, including the seven brand studios, scores 98-99 performance and 100 accessibility, best practices and SEO (Lighthouse 12, DevTools throttling).
- Studio layouts keep a fixed height on desktop, so long control columns scroll inside their pane instead of pushing the preview out of view.
- Brand assets in the Export Engine, project autosave and every PDF, ZIP and rasterizing step load on demand.

### Documentation

- README with features, screenshots, setup, tech stack and folder structure.
- CONTRIBUTING, SECURITY, CODE_OF_CONDUCT (Contributor Covenant 2.1), ROADMAP and this changelog.
- Architecture and design-token notes in `docs/`.
- Issue forms, a pull request template, CODEOWNERS, Dependabot and funding placeholders.
- CI, lint, typecheck and release workflows on Node 22 with pnpm; releases attach a build artifact.
- A welcome workflow that greets first-time contributors, introduces the project and points to good first issues.
- `.env.example` documenting the one optional variable and every external service (none need a key).
- README, ROADMAP and CONTRIBUTING cover every studio, including the brand platform.
