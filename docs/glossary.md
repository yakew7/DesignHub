# Glossary

Short definitions of the terms DesignHub uses, in alphabetical order. Each entry links to the studio or doc where you will meet it. For the token formats themselves, see [Design tokens](design-tokens.md).

**APCA Lc**: The Accessible Perceptual Contrast Algorithm from the WCAG 3 draft reports contrast as a lightness contrast value (Lc) from about -108 to 106, where the sign shows polarity and Lc 75 or more suits body text. The [Accessibility Lab](../README.md#accessibility-lab) shows it as an advisory readout next to the WCAG 2 ratio.

**Brand tokens**: The live view of your brand that every brand feature reads: colors, fonts, radius, spacing and shadow, each from the studio that owns it. See [Brand architecture](architecture.md#brand-architecture).

**`clamp()`**: A CSS function, `clamp(min, preferred, max)`, that keeps a value between two limits. DesignHub's fluid type scale uses it so each text size grows smoothly with the viewport, from the [Typography Studio](../README.md#typography-studio) to the `text-*` tokens.

**Clear space**: The empty margin that must surround a logo so other elements never crowd it, usually measured in a unit taken from the logo itself. The [Logo Studio](../README.md#logo-studio) draws it as a guide and the [Brand Guidelines](../README.md#brand-guidelines) book documents it.

**Color role**: The job a brand color does: primary, secondary or neutral. You assign roles in the [Brand Studio](../README.md#brand-studio), and every template, mockup and guideline page picks colors by role rather than by value.

**Contrast ratio**: The WCAG 2 measure of how far apart two colors are in luminance, from 1:1 to 21:1. Body text needs 4.5:1 for AA and 7:1 for AAA. Check it in the [Color Studio](../README.md#color-studio) and the [Accessibility Lab](../README.md#accessibility-lab).

**Design token**: A named design decision, such as `color-primary` or `spacing-4`, stored once and rendered into every format (CSS, Tailwind, Swift, JSON and more). The [Export Engine](../README.md#export-engine) builds them; [Design tokens](design-tokens.md) lists every group and format.

**DTCG**: The W3C Design Tokens Community Group format, a JSON standard where each token has a `$value` and a `$type`. DesignHub exports `tokens.json` in this format and the Brand Studio can import it. See [JSON token details](design-tokens.md#json-token-details).

**Gamut**: The range of colors a display or color space can show, such as sRGB or the wider Display P3. OKLCH can describe colors outside both, so DesignHub maps them into sRGB on export and flags out-of-gamut colors in the [Color Studio](../README.md#color-studio). See [Color model](architecture.md#color-model).

**Harmony**: A rule for choosing hues that work together, based on their angle on the color wheel: analogous, complementary, split-complementary, triadic, tetradic or monochromatic. Pick one in the [Color Studio](../README.md#color-studio).

**Interpolation space**: The color space a gradient blends through. OKLCH and OKLab avoid the grey, muddy midpoints that sRGB produces between distant hues. Choose it in the gradient builder of the [Color Studio](../README.md#color-studio).

**OKLCH**: A perceptual color space with three parts: lightness (L), chroma (C, colorfulness) and hue (H, an angle). Equal steps look equally different, so DesignHub stores every color in OKLCH. See [Color model](architecture.md#color-model).

**Pairing**: A heading font and a body font chosen to work together, often by contrasting categories such as a serif heading over a sans-serif body. Browse curated and suggested pairs in the [Typography Studio](../README.md#typography-studio).

**Safe area**: The part of a social image or banner that stays visible on every device, away from crops, avatars and timestamps. The [Social Media Studio](../README.md#social-media-studio) overlays it on each template.

**Semantic role**: A token named for its purpose rather than its value, such as `color-primary`, `color-accent`, `color-foreground` or `color-background`. DesignHub infers them from the palette and exports them as aliases of palette colors. See [What's included](design-tokens.md#whats-included).

**Shade**: One step of a color's tonal ramp, numbered from 50 (lightest) to 950 (darkest), the scale Tailwind uses. The [Color Studio](../README.md#color-studio) computes shades in OKLCH and exports them as tokens such as `color-indigo-500`.

**Snapshot**: A copy of every brand-defining store taken at one moment. A brand project is a snapshot, and opening a project writes it back into the studios. See [Brand Projects](../README.md#brand-projects) and [Storage](storage.md).

**Touch target**: The area a pointer or finger must hit to activate a control. WCAG 2.5.8 (AA) asks for 24 by 24 CSS px or enough spacing, and 2.5.5 (AAA) asks for 44 by 44. Test them in the [Accessibility Lab](../README.md#accessibility-lab).

**Type scale**: A set of font sizes made by multiplying a base size by a fixed ratio, such as 1.25, step by step. DesignHub's scale is fluid, with one ratio for small screens and another for large ones. Build it in the [Typography Studio](../README.md#typography-studio).

**Variable font**: A single font file with continuous axes, such as weight (`wght`) or width (`wdth`), instead of separate files per style. The [Typography Studio](../README.md#typography-studio) has a slider for every axis.
