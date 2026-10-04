import { brandSurface } from "@/lib/brand/theme";
import { contrastRatio, oklch, parseColor } from "@/lib/color/color";
import { logoAspect, nestLogo } from "@/lib/logo/compose";
import { monochromeSvg } from "@/lib/logo/recolor";
import type { BrandTokens } from "@/types/brand";

export type LogoVariantId =
  "color" | "monochrome" | "inverted" | "horizontal" | "stacked" | "wordmark" | "app-icon" | "avatar";

export type VariantContext = {
  logo: string;
  name: string;
  fontFamily: string;
  fontWeight: number;
  /** Inlined @font-face CSS so the wordmark renders in the brand font everywhere. */
  fontCss: string;
  measure: (text: string, size: number) => number;
  primary: string;
  text: string;
  light: string;
  dark: string;
};

export type LogoVariant = {
  id: LogoVariantId;
  label: string;
  description: string;
  /** Background the variant is designed for. */
  background: (ctx: VariantContext) => string;
  render: (ctx: VariantContext) => string;
  /** Square pixel sizes the logo pack exports as PNG. Omitted means one PNG at 4x. */
  pngSizes?: number[];
};

/**
 * Everything a variant needs, from the brand tokens. Variants use the light surface's primary and
 * text in both themes, so the app icon and favicon look the same wherever they are drawn.
 */
export function variantContext(
  brand: BrandTokens,
  fontCss: string,
  measure: (text: string, size: number) => number,
): VariantContext {
  const light = brandSurface(brand, "light");
  const dark = brandSurface(brand, "dark");
  return {
    logo: brand.logo.svg,
    name: brand.name,
    fontFamily: brand.typography.heading,
    fontWeight: brand.typography.headingWeight,
    fontCss,
    measure,
    primary: light.primary,
    text: light.text,
    light: light.background,
    dark: dark.background,
  };
}

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function doc(width: number, height: number, body: string, ctx: VariantContext): string {
  const style = ctx.fontCss ? `<style>${ctx.fontCss}</style>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}">${style}${body}</svg>`;
}

function wordmark(ctx: VariantContext, x: number, baseline: number, size: number, fill: string): string {
  return `<text x="${x}" y="${baseline}" font-family="'${ctx.fontFamily}', ui-sans-serif, system-ui, sans-serif" font-weight="${ctx.fontWeight}" font-size="${size}" fill="${fill}">${escapeXml(ctx.name)}</text>`;
}

const MARK = 160;

/** Clear space around the avatar mark, as a fraction of the mark's height (the logo pack default). */
export const AVATAR_CLEAR_SPACE = 0.25;

/**
 * The largest mark of the given aspect ratio whose box, grown by `clearSpace` × its height on every
 * side, still fits inside a circle of diameter `size`.
 */
export function avatarMarkSize(aspect: number, size: number, clearSpace = AVATAR_CLEAR_SPACE) {
  const height = size / Math.hypot(aspect + 2 * clearSpace, 1 + 2 * clearSpace);
  return { width: height * aspect, height };
}

/** White when it reaches 3:1 on the primary color (fine for a mark), otherwise the brand text color. */
function onPrimary(ctx: VariantContext): string {
  const primary = parseColor(ctx.primary);
  return primary && contrastRatio(primary, oklch(1, 0, 0)) >= 3 ? "#ffffff" : ctx.text;
}

function markOnly(svg: string, ctx: VariantContext): string {
  const width = MARK * logoAspect(svg);
  return doc(width, MARK, nestLogo(svg, { x: 0, y: 0, width, height: MARK }), ctx);
}

export const logoVariants: LogoVariant[] = [
  {
    id: "color",
    label: "Full color",
    description: "The primary logo.",
    background: (ctx) => ctx.light,
    render: (ctx) => markOnly(ctx.logo, ctx),
  },
  {
    id: "monochrome",
    label: "Monochrome",
    description: "One color, for single-ink print and embossing.",
    background: (ctx) => ctx.light,
    render: (ctx) => markOnly(monochromeSvg(ctx.logo, ctx.text), ctx),
  },
  {
    id: "inverted",
    label: "Inverted",
    description: "White, for dark or photographic backgrounds.",
    background: (ctx) => ctx.dark,
    render: (ctx) => markOnly(monochromeSvg(ctx.logo, "#ffffff"), ctx),
  },
  {
    id: "horizontal",
    label: "Horizontal lockup",
    description: "Mark and name side by side. The default for headers.",
    background: (ctx) => ctx.light,
    render: (ctx) => {
      const size = 72;
      const markWidth = MARK * 0.6 * logoAspect(ctx.logo);
      const gap = 28;
      const textWidth = ctx.measure(ctx.name, size);
      const height = MARK * 0.6;
      return doc(
        markWidth + gap + textWidth + 8,
        height,
        nestLogo(ctx.logo, { x: 0, y: 0, width: markWidth, height }) +
          wordmark(ctx, markWidth + gap, height / 2 + size * 0.35, size, ctx.text),
        ctx,
      );
    },
  },
  {
    id: "stacked",
    label: "Stacked lockup",
    description: "Mark above the name, for square spaces.",
    background: (ctx) => ctx.light,
    render: (ctx) => {
      const size = 56;
      const textWidth = ctx.measure(ctx.name, size);
      const markWidth = MARK * 0.75 * logoAspect(ctx.logo);
      const width = Math.max(textWidth, markWidth) + 16;
      const markHeight = MARK * 0.75;
      return doc(
        width,
        markHeight + 24 + size * 1.1,
        nestLogo(ctx.logo, { x: (width - markWidth) / 2, y: 0, width: markWidth, height: markHeight }) +
          wordmark(ctx, (width - textWidth) / 2, markHeight + 24 + size * 0.85, size, ctx.text),
        ctx,
      );
    },
  },
  {
    id: "wordmark",
    label: "Wordmark",
    description: "The name alone, in the heading font.",
    background: (ctx) => ctx.light,
    render: (ctx) => {
      const size = 88;
      const width = ctx.measure(ctx.name, size) + 8;
      return doc(width, size * 1.25, wordmark(ctx, 4, size * 0.95, size, ctx.primary), ctx);
    },
  },
  {
    id: "app-icon",
    label: "App icon",
    description: "Mark centered on a brand tile, for app stores and favicons.",
    background: () => "transparent",
    render: (ctx) => {
      const size = 512;
      const inner = size * 0.62;
      const width = inner * logoAspect(ctx.logo);
      const w = Math.min(width, inner);
      const h = w / logoAspect(ctx.logo);
      return doc(
        size,
        size,
        `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${ctx.primary}"/>` +
          nestLogo(monochromeSvg(ctx.logo, "#ffffff"), { x: (size - w) / 2, y: (size - h) / 2, width: w, height: h }),
        ctx,
      );
    },
  },
  {
    id: "avatar",
    label: "Avatar",
    description: "Mark centered in a circle, for profile pictures on GitHub, X and Slack.",
    background: () => "transparent",
    pngSizes: [400, 1024],
    render: (ctx) => {
      const size = 512;
      const { width, height } = avatarMarkSize(logoAspect(ctx.logo), size);
      return doc(
        size,
        size,
        `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${ctx.primary}"/>` +
          nestLogo(monochromeSvg(ctx.logo, onPrimary(ctx)), {
            x: (size - width) / 2,
            y: (size - height) / 2,
            width,
            height,
          }),
        ctx,
      );
    },
  },
];

export function renderVariant(id: LogoVariantId, ctx: VariantContext): string {
  const variant = logoVariants.find((item) => item.id === id) ?? logoVariants[0]!;
  return variant.render(ctx);
}

/** The horizontal lockup in white, for dark and colored backgrounds. */
export function invertedLockup(ctx: VariantContext): string {
  return renderVariant("horizontal", { ...ctx, text: "#ffffff", logo: monochromeSvg(ctx.logo, "#ffffff") });
}
