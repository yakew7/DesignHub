# Design tokens

The Export Engine turns what you have designed in each studio into one `DesignTokens` object (`types/tokens.ts`), then renders it into every format. Because all formats are generated from the same flat token list, they never disagree.

## What's included

| Group           | Source                                              | Example names                                                           |
| --------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Colors          | Color Studio palette (names come from hue families) | `color-indigo`, `color-indigo-500`                                      |
| Semantic colors | Inferred from the palette                           | `color-primary`, `color-accent`, `color-foreground`, `color-background` |
| Gradient        | Color Studio gradient                               | `gradient-primary`                                                      |
| Font families   | Typography pairing                                  | `font-heading`, `font-body`                                             |
| Rhythm          | Typography rhythm                                   | `font-weight-heading`, `leading-body`, `tracking-heading`               |
| Type scale      | Fluid scale (`clamp()`)                             | `text-xs` … `text-4xl`                                                  |
| Spacing         | 8px base (configurable)                             | `spacing-1` (4px), `spacing-2` (8px), `spacing-4` (16px)                |
| Radius          | 12px base (configurable)                            | `radius-sm`, `radius-lg` (12px), `radius-full`                          |
| Effects         | Effects Lab (shadow, glow, glass)                   | `shadow-card`, `shadow-glow`, `blur-glass`                              |

Each group can be switched off in the Export Engine settings. You can also set a variable prefix (for example `dh` → `--dh-color-primary`) and the color notation (HEX, RGB, HSL or OKLCH).

## Formats

| Format        | File                 | Notes                                                                                                         |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| CSS variables | `tokens.css`         | `:root` custom properties. Semantic colors reference palette variables with a fallback value.                 |
| SCSS          | `_tokens.scss`       | Variables plus `$colors`, `$type-scale`, `$spacing` and `$radii` maps.                                        |
| Less          | `tokens.less`        | `@` variables. Values with functions are escaped (`~"..."`) so Less passes them through unchanged.            |
| Tailwind v4   | `theme.css`          | A `@theme` block. Names follow Tailwind's namespaces, so `bg-primary`, `text-2xl` and `rounded-lg` just work. |
| Tailwind v3   | `tailwind.config.ts` | `theme.extend` with colors (including `DEFAULT` and shades), fonts, sizes, spacing and radii.                 |
| React theme   | `theme.ts`           | A typed `theme` object, plus `themeVars` to spread as CSS variables.                                          |
| Vue theme     | `theme.ts`           | The same `theme` object, an injection key, `useTheme()` and a plugin that writes CSS variables.               |
| Android       | `colors.xml`         | Palette, shades and semantic colors as `#AARRGGBB` resources with Android-safe names.                         |
| JSON tokens   | `tokens.json`        | [W3C Design Tokens (DTCG)](https://tr.designtokens.org/format/) format.                                       |

## JSON token details

- Colors use the DTCG color object: `{ "colorSpace": "oklch", "components": [l, c, h], "alpha": 1, "hex": "#6366f1" }`.
- Colors with shades are groups: `color.indigo.DEFAULT`, `color.indigo.500`, and so on.
- Semantic colors are aliases, for example `{ "$value": "{color.indigo.DEFAULT}" }`.
- Font sizes are `dimension` tokens holding the maximum size. The fluid `clamp()` expression and the minimum size are stored under `$extensions["dev.designhub.fluid"]`.
- Gradients are `gradient` tokens with stop positions between 0 and 1.

## Other outputs

- **All formats (.zip)** - every file above in one archive (React and Vue `theme.ts` go in their own folders).
- **Preview PNG** - a 2× snapshot of the live preview (html-to-image).
- **Style guide PDF** - a cover page with the preview, then colors, shades, the type scale, spacing and radii (pdf-lib).
