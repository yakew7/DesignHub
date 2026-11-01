# Simple and Advanced mode

Every studio can show its common controls first (Simple) or every control (Advanced). The switch is in each studio's header, and "Switch to Simple mode" and "Switch to Advanced mode" are in the command palette. A first visit starts in Simple. Someone who already used DesignHub starts in Advanced, so nothing they know disappears. The choice is remembered on this device (`designhub:mode`, see [storage](storage.md)).

**Hiding a control never changes its value.** A seed, a rotation or an OpenType feature you set in Advanced keeps applying in Simple mode, and exports do not change with the mode.

## What each mode shows

| Studio                | Simple                                                                   | Advanced adds                                                                |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Typography Studio     | The font browser, pairing, scale and export                              | The OpenType features panel                                                  |
| Color Studio          | Palette, harmonies, shades and contrast                                  | Fine controls of the OKLCH editor and gradient                               |
| Effects Lab           | The effect, its main controls and the CSS and Tailwind code              | The other settings of each effect and the three other code formats           |
| Background Studio     | The generator, density, scale, colors, size and Randomize                | Seed, rotation and the generator's own options                               |
| Export Engine         | Brand name, variable prefix and color notation                           | Spacing and radius bases, and which sections to include                      |
| Logo Studio           | The logo, the Variants view and the export                               | The Guides panel and the Edit panel (recolor and source)                     |
| Icon Studio           | Search, the library, color, stroke width, padding and the background     | Stroke corners and the transform controls (rotate, flip, rotation)           |
| SVG Playground        | The Document and Optimize tabs                                           | The Layers and Sprite tabs                                                   |
| Accessibility Lab     | The Contrast and Reading tabs                                            | The Vision, Targets and Motion tabs (the report is the same in both)         |
| Mockup Studio         | The headline, call to action, name and title                             | Email, phone, website and address                                            |
| Social Media Studio   | The content, the logo and the theme                                      | Colors, background style, radius, padding, safe area and the ZIP pack choice |
| Brand Studio and more | Not switched: they show everything, with folded panels for the long ones | -                                                                            |

## Controls the tests check

The table below is read by `tests/e2e/modes-table.spec.ts`, which opens each studio in both modes and checks that every control named here is shown or hidden as its row says. Moving a control between modes without editing its row fails the test and names the row. One row per control: the page, the control's role and accessible name, and the mode that first shows it (`simple` means both modes show it, `advanced` means only Advanced does).

| Page             | Role         | Name              | Shown from |
| ---------------- | ------------ | ----------------- | ---------- |
| `/typography`    | `region`     | OpenType features | advanced   |
| `/logo`          | `region`     | Guides            | advanced   |
| `/logo`          | `region`     | Edit              | advanced   |
| `/icons`         | `slider`     | Padding           | simple     |
| `/icons`         | `slider`     | Rotation          | advanced   |
| `/icons`         | `radiogroup` | Stroke corners    | advanced   |
| `/svg`           | `tab`        | Optimize          | simple     |
| `/svg`           | `tab`        | Layers            | advanced   |
| `/svg`           | `tab`        | Sprite            | advanced   |
| `/accessibility` | `tab`        | Contrast          | simple     |
| `/accessibility` | `tab`        | Reading           | simple     |
| `/accessibility` | `tab`        | Vision            | advanced   |
| `/accessibility` | `tab`        | Targets           | advanced   |
| `/accessibility` | `tab`        | Motion            | advanced   |
| `/mockups`       | `textbox`    | Headline          | simple     |
| `/mockups`       | `textbox`    | Website           | advanced   |
| `/social`        | `textbox`    | Project name      | simple     |
| `/social`        | `switch`     | Show safe area    | advanced   |
| `/social`        | `slider`     | Padding           | advanced   |
| `/backgrounds`   | `slider`     | Density           | simple     |
| `/backgrounds`   | `slider`     | Rotation          | advanced   |

## For contributors

Wrap a group of controls in `<Advanced>` (`components/ui/advanced.tsx`) or mark a whole panel `advanced`. Mark a group, not a single field, so Simple mode stays tidy. A tab that is Advanced only must send the person back to a tab that always exists when they leave Advanced (the SVG Playground does this). Add the studio's switch with `actions={<ModeSwitch />}` on its `PageHeader`, and add the controls to the first table and to the machine-readable one (the test reads it).
