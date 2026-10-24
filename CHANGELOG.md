# Changelog

All notable changes to DesignHub are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Page sections in the Brand Guidelines page list: the pages are grouped as Foundation, Logo, Color, Type, Imagery, UI, Voice and Tokens (a `section` on every `GuidelinePage`), each section folds, has a switch that turns all of its pages on or off, and shows how many of its pages are on while folded. The cover stays on, and page numbers, the contents, the PDF bookmarks, the website and the Markdown export follow the pages that are left. Tests cover every page having a section and a section that is off being left out of each export.
- Project file version 2 and migrations from 1.0 (`lib/projects/migrate.ts`): files, share links and the snapshots saved in IndexedDB carry a version; a version 1 file, link or stored project is migrated in memory (the ZIP selection of the social studio is part of the snapshot now, and effects added since 1.0 get their defaults), a file from a newer version is refused with a message that says to update, and fixtures written by 1.0 are committed with tests that open them. See [docs/migrating-to-v2.md](docs/migrating-to-v2.md).
- Token formats in tiers (Core, Frameworks, Platforms) in the Export Engine, with a search across all of them, and a deprecation note for GTK 4 CSS and Stylus (still built; removal in 2.1), also grouped in `designhub --help`.
- Brand DNA: choose the model for the AI provider, and an OpenAI-compatible provider (a base URL, a model and a key; a local server needs no key) with the destination host shown before the first request. An end-to-end test proves nothing is sent to a model host without a key.
- Golden-file snapshots for every background generator and look, every social template and mockup (light and dark) and every token format (two token sets), so any change to a drawing or an export shows in review.
- End-to-end flow tests (brand to export, project export, delete and import, keyboard only, offline) and an axe scan of every studio and tab in light and dark.
- "More platforms" in the Social Media Studio: twenty core platforms first, the rest behind a disclosure, and a default ZIP pack of the core platforms.
- Look control for the Concentric, Woven and Zigzag background generators.
- Accessibility Lab tabs, colors, contrast results and check list in en, es, fr and hi, and `completeAreas` now includes them.
- Notebook mockup: a portrait hardcover notebook with the logo debossed (a light edge and a pressed copy), the name on the cover, the website at the foot and an elastic band in the secondary color, on a desk, in light and dark. The name and website are shortened to the cover, never clipped.
- Presentation mockup: a title slide and a content slide in 16:9 on a stage, with slide title, heading and body sizes taken from the live type scale (kept inside a readable range), a headline that wraps to at most three lines and is cut to fit, the call to action as a pill and the presenter from the person and role fields.
- Trade show booth mockup: a 3 x 3 m booth in one-point perspective (back wall, side walls and floor as polygons toward one vanishing point) with a back wall graphic, a counter with the logo and a pull-up banner in the brand colors, with every line of copy kept inside a flat panel.
- Delivery van mockup: a van in side view with the livery wrapped around the body through a clip path in the brand gradient, so it follows the roof, windscreen and bonnet, with the logo, name, website and phone number shortened to the flat part of the cargo panel.
- Instagram highlight cover template (1080 x 1920): the mark and a short label centered in the circle Instagram crops to, with the label cut to 12 characters and then to the circle's width, and the zones outside the circle marked as covered.
- Grainy gradient background generator: a multi-stop gradient in palette colors (at most five stops, with the seed picking the angle and the stop order) under a fine `feTurbulence` grain blended on top, with grain strength and size controls and no embedded images.
- Scrim effect in the Effects Lab: a `::after` gradient that darkens the bottom or top of an image, with direction, strength, height and color, a preview with text over the photo backdrop, and a contrast check of the text color against the scrim over a white image that reports both ends and how far into the scrim the text stays at 4.5:1.
- Card tilt effect in the Effects Lab: a perspective hover tilt and a moving glare as plain CSS with `--tilt-x`, `--tilt-y`, `--glare-x` and `--glare-y` fallbacks, an optional snippet that sets them from the pointer, and no transform or transition under `prefers-reduced-motion`.
- Export all projects as a ZIP in Brand Projects: one `.designhub.json` per project, named like the folder autosave names them so an unpacked ZIP matches the folder, with unique and safe names, optional version history and the button disabled when there are no projects.
- Illustration brand book page (after Imagery): line weight, corner style and palette share derived from the brand radius (sharp, soft or round), and three do and three don't examples drawn with the brand colors and radius. It is in the PDF with a bookmark, the website export and the Markdown export, can be switched off, and the contents numbering follows it.
- One-color print check in the Logo Studio's Variants view: the monochrome mark is rasterized at a printed width and measured for the thinnest solid stroke and the thinnest gap (a morphological opening, in plain arrays), then compared with a 0.25, 0.5 or 1 pt minimum, with the result in millimetres, points and plain words. Corners and tapering points are not reported as thin lines.
- Guide to adding an export format (`docs/export-formats.md`): the token model, the helpers to reuse (`flatten`, `variable`, `yamlString`, `roleColor`), naming rules, light and dark roles, a worked TOML example whose code is compiled and tested, registration, the tests to write and how the ZIP and the CLI pick a format up.
- Angular Material theme export (`_theme.scss`): `mat.define-palette` maps for the primary and accent colors with every shade 50 to 900 plus the accent tones A100 to A700 (standing in for the palette's 200, 300, 400 and 500 shades), a contrast map that picks white or black per tone, and a `define-light-theme` and `define-dark-theme` pair.
- Brand book heading structure check in the Accessibility Lab: every exported brand book page needs exactly one h1, no skipped heading level and no empty heading, read from the generated HTML of the pages the website export uses, with the problems in the Reading tab and the JSON, Markdown and HTML reports.
- UI preview on the Color Studio export tab: a card, button, link and input drawn from the same `roleColor()` mapping the themed exports use, in light and dark, with the WCAG contrast of text on each surface.
- Weight comparison strip in the Typography specimen view: one row per static face or variable named instance, labelled with its numeric weight and driven by the sample text.
- Installed-app troubleshooting in the [troubleshooting guide](docs/troubleshooting.md#the-installed-app): missing install button, `.designhub.json` not opening, share target missing, stale service worker after an update, and resetting the offline cache, with Chrome, Edge and Safari steps where they differ.
- VS Code color theme export (`brand-color-theme.json`): workbench `colors` for the editor, sidebar and status bar, plus `tokenColors` for comments, strings, keywords, functions and numbers from the semantic roles, with `type` set to `light` or `dark` from the background and every syntax color at least 4.5:1 against it.
- Windows Terminal export (`scheme.json`): a `schemes` entry with `background`, `foreground`, `cursorColor` and the sixteen ANSI colors, taking hues from the palette when present and from the primary's hue ring otherwise, with foreground on background at least 4.5:1.
- Monogram logo variant: the first one or two letters of the brand name in the heading font, centered in a circle, for avatars when there is no mark, exported as SVG, PNG (400 and 1024) and PDF in the logo pack.
- GIMP palette (`.gpl`) import in Color Studio: paste a DesignHub, Inkscape or Krita palette into the existing import dialog to restore the same colors and names.
- Godot 4 export (`theme.tres`): a `Theme` resource with `Color` constants for the palette and the light and dark semantic roles, as `Color(r, g, b, a)` floats from 0 to 1 rounded to 3 places.
- Size-adjusted system font fallbacks in the Typography Studio export: a Fallback CSS format with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` matched to Arial, Times New Roman or Courier New, wired into the CSS / Tailwind / SCSS / React stacks, with [usage notes](docs/typography-fallbacks.md).
- Unity UI Toolkit export (`theme.uss`): `:root` custom properties for the palette, semantic roles, spacing and radius, with colors as hex or `rgba()` and sizes in `px` so Unity can parse every value.
- Qt Quick export (`Theme.qml`): a singleton `QtObject` with the palette and the light and dark semantic roles as `readonly property color` entries in `#AARRGGBB` order, plus spacing and radius numbers.
- Duotone effect in the Effects Lab: an SVG filter that maps photo shadows and highlights to two brand colors (`feColorMatrix` plus `feComponentTransfer`), with strength, a before/after photo preview, and the filter markup in every export format and in `effects.css`.
- Buy Me a Coffee page cover template (1200 x 400) in the Social Media Studio, with a covered avatar zone and the call to action drawn as a support button.
- Ghost publication cover template (2000 x 1000) in the Social Media Studio, with the logo, publication name and a description wrapped to three lines.

### Changed

- Brand DNA calls the Anthropic Messages API with `fetch` and local types; `@anthropic-ai/sdk` is no longer a dependency.
- Rings, arcs and squares, argyle, plaid and checks, and zigzag, chevron and squiggle are three generators with a Look control (33 generators from 39). Saved backgrounds with an old kind open as the same look.
- `lib/tokens/formats.ts` and `native.ts` are split into one module per format in `lib/tokens/formats/`; the output is unchanged byte for byte.
- The default social ZIP pack holds the core platforms instead of every template.
- Fixes found by axe: tinted success and brand badges, names that did not contain their visible text (weight rows, pairs, shades, contrast cells, font options) and the favorite heart no longer sits inside a listbox option.
- Translate the Effects Lab effect picker (every effect's name and description), the shared color and gradient fields and the focus ring, scrollbar and selection controls in every language (en, es, fr, hi), with the contrast results as `{ratio}` placeholders. A test now keeps the `effects.` messages complete in every language.

### Fixed

## v1.0.0

Released 2026-10-21. The first public release: a complete, local-first design and brand identity toolkit with seventeen studios.

### Added since the first build

- Concentric arcs background generator: nested open rings from one seeded center, with the seed choosing the center, the start angle and the sweep, and density setting how many arcs fit.
- Link underline effect in the Effects Lab: thickness, offset and color as `text-decoration-*` properties, a hover state that grows the underline with a `background-size` transition, a 4.5:1 contrast badge against the page, a link in the preview, and a `prefers-reduced-motion` rule that removes the transition.
- Wave lines background generator: parallel sine curves shifted in phase, in palette colors, with the seed choosing amplitude and phase.
- Motion brand book page: durations derived from one base value (150, 250 and 400 ms), the Enter, Exit and Move easing curves drawn as SVG paths against a straight line, do's and don'ts for animation and a reduced-motion note. It is in the PDF with a bookmark, the website export and the Markdown export, can be switched off, and the contents numbering follows it.
- Motion check in the Accessibility Lab (a Motion tab, and a section in the JSON, Markdown and HTML reports): reads the CSS each Effects Lab effect exports and lists every effect that animates or runs a transform transition, with whether it has an `@media (prefers-reduced-motion` rule.
- Button press effect in the Effects Lab: a hover lift and a pressed state as `:hover` and `:active` rules with a transform and shadow change, with lift, press depth, duration, easing, color and radius controls, a real button in the preview, and a `prefers-reduced-motion` rule that removes the transform and the transition.
- Favicon preview in the Logo Studio's Variants view: the app icon at 16 and 32 px in a light and a dark browser tab, drawn from the same SVG the favicon package exports and updating live with the brand.
- Rhombus background generator ("tumbling blocks"): a seamless tessellation of diamonds shaded in three tones per cube, with the seed picking each cube's palette color and density setting the cube size.
- `--watch` (`-w`) for `designhub build`: rebuilds whenever the project file changes, debounced, one line per rebuild, keeps running after an invalid file and exits 0 on Ctrl+C.
- Notion page cover template (1500 x 600) in the Social Media Studio, with the page icon and title zone kept clear.
- Medium publication banner template (1500 x 500) in the Social Media Studio, with the logo, name, a tagline shortened to two lines and the links.
- Social template guide (`docs/social-templates.md`): platform sizes, safe and covered areas, the shared helpers, registration and tests, built around the Notion cover.
- GTK 4 CSS export (`gtk.css`): libadwaita `@define-color` entries for the accent, window and view colors, with a light block and a dark one inside a `prefers-color-scheme: dark` media query.
- Tamagui export (`tamagui.config.ts`): `createTokens` for color, space, size and radius with camelCase keys (prefixed when a token prefix is set), plus `light` and `dark` themes from the semantic roles.
- Radix Themes export (`radix-theme.css`): 12 step `--accent-*` and `--gray-*` scales in `.light, .light-theme` and `.dark, .dark-theme` blocks built from the 50 to 950 shades, and `--radius-factor` from the medium radius.
- Etsy shop banner template (3360 x 840) in the Social Media Studio, with a covered shop-icon zone and safe-area-aware content.

- Compare original and optimized SVGs in the SVG Playground with an aligned, clipped preview and a keyboard- and touch-operable divider.
- HTML export in Icon Studio: an inline SVG with `role="img"` and an `aria-label` from the icon name, plus a decorative variant with `aria-hidden="true"`.
- Preact component converter in the SVG Playground.
- X post image template (1600 x 900) in the Social Media Studio.
- Zigzag background generator with seeded palette-colored rows and independent density and amplitude controls.
- Pinterest board cover template (600 x 600) in the Social Media Studio.
- Export an icon as a Preact component.
- Ant Design 5 theme export (`antd-theme.ts`): a `ThemeConfig` with the seed tokens only (`colorPrimary`, `colorBgBase`, `colorTextBase`, `borderRadius`, `fontFamily`), as a light config and a dark one that asks Ant Design for `darkAlgorithm`.
- Material UI v6 theme export (`theme.ts`): `createTheme` with light and dark color schemes from the semantic roles, a light / main / dark ramp taken from each palette color's own shades, the heading and body fonts from the type scale, and `shape.borderRadius` from the radius scale.
- Mantine v7 theme export (`theme.ts`): `createTheme` with each palette color as a ten-shade tuple, plus primary color, fonts, headings, radius, spacing and shadows.
- Vuetify 3 theme export (`vuetify.ts`): a `createVuetify` theme with a light and a dark color set built from the semantic roles, the palette as extra theme colors, and contrast-picked `on-primary` and `on-secondary` labels.
- WinUI / WPF export (`Theme.xaml`): a `ResourceDictionary` with `Color` and `SolidColorBrush` resources for the palette and Light and Dark `ThemeDictionaries` for the semantic roles.
- Scrollbar effect in the Effects Lab: thumb, hover and track colors, width and radius as `scrollbar-color` and `scrollbar-width` with a `::-webkit-scrollbar` fallback, a scrolling preview and a 3:1 thumb contrast badge.
- Flow field background generator: seeded noise-driven curves, one path per palette color, with bounded path counts and sizes.
- APCA view of the Color Studio contrast matrix: a WCAG 2 / APCA switch (kept for the session) showing signed Lc values with a text label and meter for the Bronze level each pair reaches.
- Skip links to the preview and to the code and exports pane in every studio, translated (en, es, fr, hi) and moving focus into the pane.
- Seal logo variant: the mark inside a ring with the brand name set on a circular path, repeated for short names and shrunk for long ones, exported as SVG, PNG (512 and 1024) and PDF in the logo pack.
- App store screenshots mockup (1800 x 1320): three phones on a brand gradient, each with a caption above it taken from the headline, call to action and title fields.
- Layout preview in the Typography pairing studio: judge a pair in a blog article, a pricing card or a landing hero, sized from the live type scale and colored from the brand, with translated labels (en, es, fr, hi).
- Download Markdown in Brand Guidelines: one `brand-guidelines.md` in the PDF's page order and numbering, with the page text, relative links to the SVG page art and logo files, and palette and logo tables, zipped with those files.
- `designhub` command line (`packages/cli`): `designhub build brand.designhub.json --format css,tailwind-v4 --out tokens/` writes any Export Engine format from an exported project file, deterministically, with no runtime dependencies. The workspace now has a `packages/` folder and the app package is named `designhub-app`.
- Open `.designhub.json` files from the installed app: a `file_handlers` manifest entry and a share target (answered by the service worker, so nothing is uploaded) lead to an import prompt, translated (en, es, fr, hi), that validates and sanitizes the file like a normal import and never replaces the open project. Browsers without a launch queue see no change.
- Brand DNA AI provider with your own API key (Anthropic Messages API, `claude-opus-5-5`): the key lives only in IndexedDB and is removed with one click, the exact downscaled images and instructions are shown before the first request, and any failure (bad key, rate limit, network, odd answer) falls back to the on-device result with a note.
- .NET MAUI export (`Colors.xaml`): a `ResourceDictionary` with `Color` and `SolidColorBrush` resources for the palette and each role in light and dark.
- Selection effect in the Effects Lab: `::selection` background and text colors with a forced-colors rule, a matching caret color, Tailwind `selection:` guidance and a 4.5:1 contrast badge.
- Scroll shadow effect in the Effects Lab: edge shadows that show only while there is more to scroll, in pure CSS with `background-attachment: local`, with color, strength, height and box background controls.
- Plaid background generator: translucent crossing bands in palette colors that repeat seamlessly, seeded, with density setting the repeat size.
- Circle packing background generator: non-overlapping circles of varied size in palette colors, seeded, with capped circle and attempt counts.
- Gumroad profile cover template (1280 x 420) in the Social Media Studio, with the avatar's covered zone kept clear.
- Ko-fi page banner template (1920 x 480) in the Social Media Studio, with a support button from the call to action field.
- Smartwatch mockup: a watch face with the brand mark, time and activity ring, and a notification from the app, with long names and messages shortened to the display.
- Social share logo variant (1200 x 630): the lockup centered inside the crop-safe area, scaled down for long names, exported as SVG, PNG (1200 and 2400) and PDF in the logo pack.
- Data Visualization brand book page: six categorical series colors checked against color blindness (OKLab distance under protanopia, deuteranopia and tritanopia), a sequential and a diverging ramp from the brand, and a sample chart.
- Paint.NET palette export (`.txt`, one `AARRGGBB` color per line) in the Color Studio download menu, capped at 96 colors with the same notes as the Procreate export.
- App shortcuts in the web app manifest: the installed app's icon menu opens Colors, Typography, Brand Projects and the Export Engine.
- `designhub build -` reads the project file from standard input, so the CLI can sit in a pipeline.
- Text spacing tester in the Accessibility Lab (WCAG 1.4.12): a switch applies line height 1.5, paragraph spacing 2x, letter spacing 0.12em and word spacing 0.16em to the preview and says whether any text is clipped, and the JSON, Markdown and HTML reports list each value against the minimum.
- Guide to adding a mockup template (`docs/mockup-templates.md`), with a worked example whose code is tested.
- CLI and CI guide (`docs/cli.md`): running the CLI, its guarantees and exit codes, and GitHub Actions recipes for building tokens, drift checks, auto-commits and monorepos.

### Changed since the first build

- Announce generated and loaded Color Studio palettes to screen readers, including locked swatches kept during generation.
- Translate the rest of the Typography pairing studio in every language (en, es, fr, hi): the Pair panel, the Heading and Body labels and pickers, the lock and unlock buttons, Swap, Save, Random pair, the pairing suggestion heading, the saved and curated galleries, the pair card labels and the save toast.

### Fixed since the first build

- Keep Color Studio undo and redo usable after global undo or redo, and reset both histories immediately when opening another project.

### Added

#### Platform

- Next.js 16 App Router app with strict TypeScript, Tailwind CSS v4 and shadcn/ui primitives.
- DesignHub design system: dark-first editorial theme with a light mode, Inter and Space Grotesk, 12px radius, 8px spacing rhythm and 150–200ms motion.
- Responsive app shell with a studio sidebar grouped into Brand, Design and Tools, a header nav and a mobile navigation sheet.
- Dark and light themes that follow the system preference, toggled with `⌥T`.
- Command palette (`⌘K` or `/`) that searches studios, actions, Google Fonts and Iconify.
- Keyboard navigation (`G` then `H`/`R`/`D`/`L`/`M`/`O`/`U`/`P`/`T`/`C`/`I`/`B`/`F`/`S`/`A`/`E`), `[` and `]` to cycle Mockup and Social templates, and a shortcuts dialog (`?`).
- Toast notifications for copy, save and download actions.
- Local-first persistence: every studio saves to IndexedDB through a Dexie-backed Zustand storage adapter.
- Homepage with a hero, search bar, a card for every studio, principles section, GitHub call to action and footer.
- Resizable three-pane studio layout (controls · live preview · code and exports) with keyboard-operable dividers, stacking on small screens.
- Reusable SVG preview canvas with zoom, fit, 100%, backdrops, size and byte readouts.
- A production-only PWA service worker with versioned offline app-shell caching, runtime Google Fonts and Iconify caching, and user-controlled updates.
- Arrow-key navigation (with Home and End) in every custom radio group: template, generator, effect, provider, vision and library pickers.
- Brand actions in the command palette: new brand project, open any project, download the brand book PDF and the logo pack ZIP.
- Vitest unit tests for color, APCA, palette import, project transfer and sorting, SVG optimizing, native token formats, Brand DNA and the brand randomizer, run in CI with `pnpm test`.
- WebP export next to PNG in the Logo, Mockup and Social studios, with transparency preserved.
- Studio pane sizes are remembered per studio (in localStorage), restored before first paint; double-click a divider to reset it.
- A keyboard shortcuts guide (`docs/shortcuts.md`), checked against the shortcuts dialog by a test. The dialog now lists the `G` then `D`, `O`, `U` and `P` shortcuts too.
- Tests that render every background generator, social template and mockup template and check the SVG is well-formed at the right size.
- A Lighthouse CI workflow that checks accessibility, best practices and SEO (100) and performance (90, as a warning) on the main routes for every pull request.
- Unit tests for readability, the SVG sprite builder and every registered effect.
- A bundle size check on pull requests (`pnpm bundle:size`): first-load JS per route, compared with the base branch, failing on growth over 10%.
- Unit tests for gradients, touch targets and font pairing. They fixed an undersized touch target passing WCAG 2.5.8 next to a large neighbor, and a random pairing that could pair a font with itself.
- A translatable interface: typed message catalogs with English fallback, a language switcher in the header and Spanish as the first extra locale (the app shell, the command palette and Brand Projects). Routes and static prerendering are unchanged.
- The Typography Studio and the home page no longer scroll sideways on phones.
- Unit tests for shades, the color blindness simulation and logo recoloring; recoloring now handles `!important` style colors.
- Hindi as a third interface language, and translated project compare and history dialogs and Color Studio. Devanagari falls back to a system font.
- A More menu in the header holds the links hidden on medium screens.
- Unit tests for SVG path lengths and the animated logo; they fixed `pathLength` handling in the animation and rounded rectangles with `rx="auto"`.
- French as a fourth interface language, and a translated Brand Studio and home page.
- Playwright smoke tests open every route and fail on page errors, console errors or a missing heading; they run in CI (`pnpm test:e2e`).
- Refreshed README screenshots for every studio.
- Switch the interface language from the command palette: type "language" or a language name, in any supported language.
- Unit tests for color names, ICO encoding and the favicon helpers; the favicon tests fixed an unescaped theme color in the generated `<meta>` tag.
- Palette changes (a new palette, loading one from the library) are announced to screen readers.
- A troubleshooting guide (`docs/troubleshooting.md`) for lost work, offline fonts, blocked downloads, folder autosave permissions, stale service workers and resetting.
- Unit tests for the PNG and SVG credit helpers and the seeded random helpers. The credit tests fixed an exported SVG with a self-closing root getting the credit note after the element (invalid XML).

#### Brand Studio

- The hub of the identity: name, description, logo, colors with roles, fonts, radius, spacing and shadow, edited in one place.
- A synchronized brand token system. The brand store holds only what is unique to the brand; colors, type, radius, spacing and shadows are read live from their own studios, so there is never a second copy.
- Live brand preview in light and dark with a UI kit, and a token panel that exports straight from the Export Engine.
- A geometric logo mark generated from the brand name until an SVG is uploaded (uploads are sanitized).
- Surprise me: a one-click random brand (palette, font pair, radius and shadow) that can be undone.
- Import a brand from a W3C DTCG `tokens.json` (including the Export Engine's own): colors, fonts, radius and spacing go to their studios, with a summary and undo. The Brand JSON now includes the mission and values.
- Import colors and fonts from pasted CSS: the most used colors (hex, rgb, hsl, oklch) and font families, with a preview, fonts outside the catalog listed but skipped, and undo.
- Undo and redo for brand changes across every studio (`Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z` and command palette entries): snapshots after a pause in editing, up to 50 steps, ignored inside text fields.

#### Brand DNA (beta)

- Upload a logo, product shot or moodboard and extract a weighted palette, mood, type pairing, radius and personality.
- Provider architecture: an on-device heuristic provider and a mock AI provider that returns sample data, both behind one interface, ready for a model-backed provider.
- Staged loading states, editable results with a copy button for each extracted color, and one-click apply to the brand with undo.
- Paste an image from the clipboard anywhere on the page, and an Ignore background option that leaves the flat border color out of the palette.
- Each extracted color shows its contrast on white and black, with screen-reader text.
- Combine up to five images into one result, weighted by image area, each with its own Ignore background switch.
- Each extracted color shows which of the combined images it came from, with their share.

#### Logo Studio

- SVG logo editor: recolor every color in the mark, monochrome and inverted modes.
- Construction grid, clear space (adjustable) and safe area guides.
- Responsive variants: full color, monochrome, inverted, horizontal and stacked lockups, wordmark and app icon, with a minimum size strip and background tests.
- Logo pack export: every variant as SVG, PNG and PDF in one ZIP with usage notes.
- A favicon package (.zip) built from the app icon variant, also included in the logo pack as `favicon/`.
- A circular avatar variant for profile pictures, added to the logo pack as SVG, PDF and 400 and 1024 px PNGs.
- Animated SVG export: the logo draws itself in from measured path lengths, then the fills fade in. It plays once or loops and shows the final logo under reduced motion.
- Recoloring and monochrome now include colors set in `<style>` elements (class-based fills from Illustrator), and the output stays sanitized.

#### Mockup Studio

- Business card, letterhead, envelope, stickers and poster print mockups.
- Landing page on a laptop, analytics dashboard on a desktop display and a three-screen mobile app.
- Drawn with SVG from the live brand tokens, in light and dark, with the brand fonts embedded.
- High-resolution PNG (up to 4×) and PDF export.
- A Merch mockup with a T-shirt and a tote bag, an ID badge on a lanyard, and an email signature that can be copied as rich HTML.
- Coffee cup and billboard mockups.
- Shopping bag and browser tab mockups; the browser tab shows the app icon as a favicon at 16 px with a 2x callout.
- Long brand names no longer overlap the landing page navigation in the laptop and browser tab mockups: links move, drop or the name shrinks and truncates.
- A tablet mockup: the dashboard in landscape and a one-column landing page in portrait.
- A phone lock screen mockup with a brand wallpaper, the time and two notifications that use the app icon.

#### Social Media Studio

- GitHub repository banner gallery with fifteen styles (Minimal, Editorial, Aurora, Grid, Terminal, Glass, Gradient, Split, Bento, Spotlight, Classic, Launch, Showcase, Features, Badges), nested under a collapsible Repository banner row in the template list.
- LinkedIn cover, X header, Instagram square post and story, three Open Graph layouts, Product Hunt gallery image and YouTube thumbnail.
- A README snippet for GitHub banners, with an optional "Banner made with DesignHub" link under the banner (on by default, never drawn on the image), and a one-click copy of the `made-with-designhub` topic for gallery submissions.
- A shared content panel under the preview: project name, description, website, GitHub username, logo upload, primary and secondary colors, background style, border radius and padding, applied to every template. Saved with brand projects.
- Platform presets with exact sizes, a safe area overlay and the zones covered by platform UI.
- Automatic logo, typography and colors, editable copy, Export PNG (plus @1x and @2x), SVG export, copy image to the clipboard, Open Graph meta tags and a ZIP of every asset.
- Pinterest pin (1000 x 1500), Bluesky banner, Facebook cover, LinkedIn company page cover and Discord server banner templates.
- Choose which templates go into the social asset ZIP.
- Twitch channel banner, Mastodon header (with the avatar zone marked) and Instagram portrait post (1080 x 1350) templates.
- YouTube channel banner (with the 1546 x 423 safe area), Reddit community banner and Tumblr header templates.
- Dribbble shot (1600 x 1200) and Behance project cover (808 x 632) templates.
- Patreon cover (1600 x 400) and Kick channel banner (1920 x 480) templates.
- Long websites, handles and names are shortened to fit their space in every template, so nothing runs past the safe area.
- Bandcamp header (975 x 180) and Product Hunt thumbnail (240 x 240) templates.
- Twitch offline screen (1920 x 1080) and LinkedIn event cover (1776 x 444) templates.
- Telegram channel cover (central 60 percent safe area), Substack publication banner and Spotify playlist cover templates.
- DEV post cover (1000 x 420) and Hashnode blog cover (1600 x 840) templates.

#### Brand Guidelines

- A complete brand book generated from the brand: cover, introduction, logo usage, clear space, minimum size, incorrect usage, color palette, typography, iconography, imagery, UI components, accessibility, voice and tone, social media, and a two-page design token appendix.
- Pages can be switched off; numbering and contents update automatically. Voice and tone are edited in place.
- Export the full book as a PDF with pdf-lib, or any page as PNG.
- Three cover layouts (Gradient, Minimal, Editorial) that persist and apply to every PDF export. The book is twenty-one pages, with Imagery and Social media pages drawn from the brand.
- A Mission and values page: a statement and up to four values, edited in place and saved with brand projects.
- The PDF has bookmarks for every included page and a clickable contents page.
- Download website: the brand book as a static site ZIP with real HTML text, the page art, logo files and token downloads, ready for GitHub Pages or Netlify.
- A Co-branding page: the logo next to a neutral partner mark, with the divider, clear space spacing, size balance and a do and a don't.
- A Color usage page: 60 / 30 / 10 proportions from the color roles, approved text-on-color pairs with their real contrast, and two don'ts.
- A Typography usage page: the hierarchy from the live type scale, line length and line height guidance, and two don'ts.
- A Spacing and layout page: the spacing scale drawn to size, the radius scale and a 12-column grid, from the live tokens.

#### Brand Projects

- Keep several brands in the browser, each a snapshot of every brand-defining studio, stored in IndexedDB (Dexie v3 schema).
- Create, open, rename, duplicate, delete and favorite projects; last opened and last edited times; search and a favorites filter.
- The open project autosaves as you work in any studio.
- Import and export projects as JSON, one at a time or all at once, with validation and logo sanitizing on import.
- Sort projects by last opened, last edited, name or created date, and undo a delete from the toast.
- Tags (up to five per project) with a tag filter; tags are exported and validated on import.
- Share a brand as a link: the snapshot is compressed and checksummed into the URL hash, validated like an imported file and added as a new project after a prompt. The uploaded logo is left out if the link would be too long.
- Compare two projects side by side, with differences highlighted and announced; on phones each property stacks.
- Version history per project: a version every five minutes of editing and before Surprise me, token import, Brand DNA apply, share-link import and palette loads, capped at 20, with preview and undoable restore. Deleting a project removes its history (and undo brings it back).
- Optionally include version history in project exports; imported versions are validated, sanitized and capped.
- Start a new project from any history version, leaving the current one untouched.
- Autosave to a folder (Chromium): pick a folder and every autosave also writes `<name>-<id>.designhub.json` there, with a status line, permission re-request, rename cleanup and nothing written outside the folder.

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
- A Compare toggle that shows the active font next to a pinned second font with the same text and settings, plus Swap and Close compare.
- A weight waterfall under the specimen that loads each weight only when it scrolls into view; click a row to use that weight.
- The font list is a keyboard listbox: arrow keys, Page Up / Down, Home / End, `Enter` to pick and `S` to favorite.
- Sample texts in English, Spanish, German, Vietnamese, Greek and Cyrillic, plus numbers and punctuation, with a note when characters fall back.

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
- Import palettes from Coolors URLs or any text containing 3- or 6-digit hex codes.
- Export the palette as a GIMP / Inkscape / Krita palette (`.gpl`).
- Download the palette as a PNG swatch strip, next to the code formats.
- Download the palette as an Adobe Swatch Exchange (`.ase`) file, with shades grouped per color.
- Sketch palette and Procreate swatches downloads, with every palette file in one Download menu.
- Download the palette as a Krita palette (`.kpl`).
- The starter palette now passes every color vision simulation.
- Export the palette as a Markdown table.

#### Icon Studio

- Iconify search across 200,000+ icons, with collection browsing and license details.
- Favorites and an IndexedDB cache so icons you have opened keep working offline.
- Browse by topic: 240 curated icons in 10 themed packs, every id verified against Iconify, and one-click search suggestions.
- SVG editing: color, stroke width, rounded/sharp corners, rotate (`R`), flip, padding and background shapes.
- Favicon generator producing `favicon.ico`, `icon.svg`, Apple touch and PWA icons, `site.webmanifest` and HTML, bundled as a ZIP.
- Exports: SVG, React TSX component, CSS data URI, PNG (16-1024px) and ICO.
- Reliable loading: automatic fallback to Iconify mirror hosts, per-request timeouts, progressive batches, retry for failed icons and a clear error state. Icons render when IndexedDB is blocked, and exported SVG is valid XML in every browser.
- Export an icon as a Vue 3 single-file component.
- Export an icon as a Svelte 5 component.
- Export an icon as an Angular standalone component.
- Export an icon as a SolidJS component.
- Export an icon as a Qwik component.
- Export an icon as a Lit web component.
- Export an icon as an Astro component.
- Export an icon as a React Native SVG component (reusing the SVG Playground converter).

#### Background Studio

- Thirty-one procedural generators: waves, organic blobs (Paper.js smoothing), mesh gradients, aurora, noise textures, dot, grid and isometric patterns, concentric rings, checkerboard, low-poly mosaic, bokeh, confetti, chevron, honeycomb hexagons, sunburst, topographic contour lines, rotated stripes, plus signs, a starfield, Voronoi cells (computed in plain TypeScript, edge to edge), crosshatch, a circuit board with non-overlapping traces, halftone dots (linear, radial or seeded), triangles, squiggles, concentric squares, argyle, zigzag, a spirograph and Truchet tiles.
- Deterministic seeds with randomize (`Space`), color controls with a "use palette" shortcut, density, scale, rotation and canvas presets.
- Exports: SVG, PNG (1× and 2×) and CSS backgrounds (native gradients where possible, inline SVG otherwise).
- The dots, checks, chevron and hexagons patterns now follow the seed, so a new seed shifts them.

#### Effects Lab

- Glassmorphism, neumorphism, layered shadow (15 presets, from hairline and material to brutal and focus ring), glow, gradient and animated borders, and grain overlay generators.
- Live preview on gradient, photo, light and dark backdrops.
- Exports: CSS, Tailwind arbitrary-property classes, Tailwind v4 `@utility`, SCSS mixins and React style objects, plus an `effects.css` bundle.
- An inner shadow effect with Input, Pressed and Deep well presets, in every export format and in `effects.css`.
- A long shadow effect for boxes and text, with an angle, length and fade, at most 60 shadow steps.
- The long shadow fades evenly on boxes: each step's opacity is set so the stacked copies follow a straight ramp.
- A gradient text effect using the Color Studio gradient, with an optional animated shift that stops under reduced motion and a solid color fallback.
- A skeleton shimmer effect in the brand's neutrals, static under reduced motion.
- A text outline effect with an optional offset shadow copy and a solid color fallback.
- A focus ring effect: an outer outline and an inner ring with a WCAG contrast check against the page and the component, and a nearest passing color suggestion.

#### SVG Playground

- Upload, drag and drop, paste or edit SVG source, with a script-safe preview.
- viewBox editor, element tree, path and group inspector (svg-path-parser) and fill/stroke editing per element or for every shape.
- Optimization engine built on svgson: metadata and editor-data removal, id cleanup, group collapsing, precision control, shortest path data, color shortening and always-on sanitizing; minify and pretty print.
- Converters: SVG → JSX, SVG → React component and SVG → React Native (react-native-svg).
- Sprite generator with namespaced symbol ids and usage snippets.
- An SVG to Vue component converter.
- A CSS data URI output that encodes only what it must, so it is shorter than base64. Sprite ids no longer collide when symbol and internal ids share hyphens.
- An SVG to Svelte component converter. Renaming a sprite symbol is free while typing and is de-duplicated on blur or `Enter`, so two symbols never share an id.
- An SVG to Angular component converter.
- An SVG to SolidJS component converter.
- An SVG to Qwik component converter.
- An SVG to Lit component converter.
- An SVG to Astro component converter.

#### Accessibility Lab

- WCAG contrast checks for body text, links, button labels and non-text UI, with AA/AAA verdicts and one-click fixes.
- Vision simulation (protanopia, deuteranopia, tritanopia, grayscale, low vision) with perceived-contrast measurements.
- Readability analysis: font size, line height, characters per line measured in the real font, Flesch reading score.
- Dyslexia preview with spacing controls, a friendly preset and a reading simulation.
- Touch-target validation for WCAG 2.5.5 (44px) and 2.5.8 (24px + spacing).
- Downloadable JSON accessibility report.
- APCA (WCAG 3 draft) Lc contrast next to every WCAG 2 ratio, with Bronze targets per text role and an APCA section in the report.
- Download the report as Markdown, with a contrast table (ratio, AA / AAA and APCA Lc).
- A focus indicator check (WCAG 2.4.13 and 1.4.11): the brand's focus ring against the page and the focused component, with a one-click fix, in both reports.
- Text contrast across the brand gradient: the worst point for white, black and the brand text color, in both reports.
- A check that flags palette colors that become hard to tell apart under protanopia, deuteranopia, tritanopia or grayscale, with a lightness suggestion, in both reports.
- Download the report as a standalone HTML page with captioned tables and no scripts (checked with axe: no violations).

#### Export Engine

- Shared design-token model assembled live from all studios, with semantic color roles.
- Configurable name, variable prefix, color notation, spacing base, radius base and included sections.
- Generators for CSS variables, SCSS, Less, Tailwind v4 `@theme`, Tailwind v3 config, React theme, Vue theme, Android `colors.xml` and W3C DTCG JSON.
- Live preview UI kit, one-click copy, Download JSON, all formats as a ZIP, preview PNG (html-to-image) and a PDF style guide (pdf-lib).
- Effect tokens (`--shadow-card`, `--shadow-glow`, `--blur-glass`) in every format.
- Assets section with background CSS and SVG, the effects bundle, the optimized SVG and the accessibility JSON report.
- Vue 3 theme export (theme object, injection key, plugin and CSS variables) alongside the React theme.
- Brand assets section: Brand JSON, the brand guidelines PDF, the logo pack ZIP and the social asset ZIP, loaded on demand.
- A "Made with DesignHub" credit in the metadata of every exported PNG and PDF, in generated SVGs, and in the README of every ZIP pack. The artwork itself is never changed.
- More token formats: styled-components / Emotion theme, Flutter `ThemeData`, SwiftUI `Color` extensions and Tokens Studio (Figma) JSON.
- JavaScript module (`tokens.mjs`), Stylus and Jetpack Compose (`Theme.kt`) formats. Similar color names (such as `indigo` shade 250 and `indigo-2` shade 50) stay separate keys in the styled-components theme.
- YAML tokens and a Sass map with a `token($group, $name)` function.
- UnoCSS and Panda CSS presets; Panda gets semantic tokens with `_dark` values.
- Bootstrap 5 Sass variables and a Chakra UI v3 theme with semantic tokens.
- A shadcn/ui theme (OKLCH, light and dark) and Figma Variables JSON for the variables REST API.
- A Style Dictionary build (tokens plus config, checked against the real tool) and a React Native theme with light and dark colors.
- Xcode asset catalog color sets (light and dark appearances) and typed CSS custom property registrations with `@property`.
- A CSS `light-dark()` theme and a Material 3 `themes.xml` (with `values-night`) for Android that shares its role mapping with the Compose export.

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
- The font browser is virtualized, so only visible rows (plus overscan) stay in the DOM while scrolling.
- Dexie, dialogs and click-only code load on first use and the service worker registers after load, lifting mobile Lighthouse on `/brand` and `/colors` by about 0.01 to 0.03.

### Documentation

- README with features, screenshots, setup, tech stack and folder structure.
- CONTRIBUTING, SECURITY, CODE_OF_CONDUCT (Contributor Covenant 2.1), ROADMAP and this changelog.
- Architecture and design-token notes in `docs/`.
- Issue forms, a pull request template, CODEOWNERS, Dependabot and funding placeholders.
- CI, lint, typecheck and release workflows on Node 22 with pnpm; releases attach a build artifact.
- A welcome workflow that greets first-time contributors, introduces the project and points to good first issues.
- An em dash check (`pnpm check:dashes` and the Em dash workflow) that fails if an em dash appears in any file.
- Unit tests with Vitest (`pnpm test`, run in CI), starting with the color engine and palette import.
- `AGENTS.md` guide for AI coding agents, with Next.js 16 notes and the project rules.
- `.env.example` documenting the one optional variable and every external service (none need a key).
- README, ROADMAP and CONTRIBUTING cover every studio, including the brand platform.
- A storage guide (`docs/storage.md`) listing everything DesignHub saves in the browser and how to reset it, plus Logo, Brand DNA and Projects screenshots in the README.
- A FAQ (`docs/faq.md`), a keyboard shortcuts guide (`docs/shortcuts.md`) and a self-hosting guide for Vercel, Netlify, a Node server and Docker (`docs/self-hosting.md`), a design tokens glossary (`docs/glossary.md`) and a first contribution walkthrough (`docs/first-contribution.md`, building a SoundCloud header).
