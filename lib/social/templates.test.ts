import { describe, expect, test } from "vitest";

import { brandSurface } from "@/lib/brand/theme";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { measureText } from "@/lib/logo/measure";
import { getTemplate, mockupTemplates } from "@/lib/mockups/registry";
import { landingNav } from "@/lib/mockups/templates/laptop-landing";
import type { MockupContext } from "@/lib/mockups/types";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { resolveSocialContent } from "@/lib/social/content";
import { socialTemplates } from "@/lib/social/registry";
import type { SocialContext } from "@/lib/social/types";
import { rootSize, xmlError } from "@/lib/test/xml";
import type { BrandMode } from "@/types/brand";

/** The default brand, built the same way `useBrandTokens()` builds the live one. */
function drawContext(mode: BrandMode, name?: string) {
  const { brand, colors, typography, tokens, effects } = defaultSnapshot(name);
  const tokensForBrand = buildBrandTokens({
    profile: brand.profile,
    swatches: colors.swatches,
    gradient: colors.gradient,
    headingFont: typography.headingFont,
    bodyFont: typography.bodyFont,
    catalog: [],
    rhythm: typography.rhythm,
    scale: typography.scale,
    radiusBase: tokens.settings.radiusBase,
    spacingBase: tokens.settings.spacingBase,
    shadowLayers: effects.settings.shadow.layers,
  });
  return {
    brand: tokensForBrand,
    surface: brandSurface(tokensForBrand, mode),
    mode,
    fontCss: "",
    measure: measureText,
  };
}

function socialContext(mode: BrandMode, name?: string): SocialContext {
  const draw = drawContext(mode, name);
  const { social } = defaultSnapshot(name);
  return {
    ...draw,
    content: resolveSocialContent(social.content, draw.brand),
    layout: { padding: social.design.padding, background: social.design.background },
  };
}

function mockupContext(mode: BrandMode, name?: string): MockupContext {
  return { ...drawContext(mode, name), content: defaultSnapshot(name).mockups.content };
}

const modes: BrandMode[] = ["light", "dark"];
// Characters that must be escaped, to catch text written into the SVG unescaped.
const trickyName = `Tom & Jerry's "<Studio>"`;

// Both suites loop over the registries, so new templates are covered as soon as they are registered.
describe.each(socialTemplates.map((template) => [template.id, template] as const))("social %s", (_id, template) => {
  test.each(modes)("renders well-formed XML at the platform size (%s)", (mode) => {
    const svg = template.render(socialContext(mode));
    expect(xmlError(svg)).toBeNull();
    const size = rootSize(svg);
    expect(size.tag).toBe("svg");
    expect(size.width).toBe(template.width);
    expect(size.height).toBe(template.height);
    expect(size.viewBox).toEqual([0, 0, template.width, template.height]);
  });

  test("escapes the brand name", () => {
    expect(xmlError(template.render(socialContext("light", trickyName)))).toBeNull();
  });
});

describe.each(mockupTemplates.map((template) => [template.id, template] as const))("mockup %s", (_id, template) => {
  test.each(modes)("renders well-formed XML with a matching size and viewBox (%s)", (mode) => {
    const svg = template.render(mockupContext(mode));
    expect(xmlError(svg)).toBeNull();
    const size = rootSize(svg);
    expect(size.tag).toBe("svg");
    expect(Number.isInteger(size.width) && size.width > 0).toBe(true);
    expect(Number.isInteger(size.height) && size.height > 0).toBe(true);
    expect(size.viewBox).toEqual([0, 0, size.width, size.height]);
  });

  test("escapes the brand name", () => {
    expect(xmlError(template.render(mockupContext("light", trickyName)))).toBeNull();
  });
});

test("the browser tab draws the app icon favicon at 16 px in the tab, the 1x callout and the 2x zoom", () => {
  const svg = getTemplate("browser-tab")!.render(mockupContext("light"));
  const favicons = svg.match(/<svg[^>]* width="16" height="16" viewBox="0 0 512 512"/g) ?? [];
  expect(favicons).toHaveLength(3);
});

describe("landing page nav", () => {
  const sixty = "Northwind Analytics Cooperative for Sustainable Data Systems";
  const boxes = (nav: ReturnType<typeof landingNav>) =>
    [nav.name, ...nav.links, nav.cta].map((box) => ({ start: box.x, end: box.x + box.width }));

  test("a 60 character name never overlaps the links or the button", () => {
    expect(sixty).toHaveLength(60);
    for (const mode of modes) {
      for (const width of [1440, 1024, 800]) {
        const ctx = mockupContext(mode, sixty);
        const nav = landingNav(ctx, width);
        const sorted = boxes(nav);
        for (let i = 1; i < sorted.length; i++)
          expect(sorted[i]!.start, `${width}`).toBeGreaterThan(sorted[i - 1]!.end);
        expect(
          ctx.measure(nav.name.text, ctx.brand.typography.heading, ctx.brand.typography.headingWeight, nav.name.size),
        ).toBeCloseTo(nav.name.width);
      }
    }
  });

  test("names from 3 to 60 characters fit at the laptop size, and short names keep every link", () => {
    for (let length = 3; length <= 60; length++) {
      const nav = landingNav(mockupContext("light", sixty.slice(0, length).trim()), 1440);
      const sorted = boxes(nav);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i]!.start, `${length}`).toBeGreaterThan(sorted[i - 1]!.end);
      if (length <= 12) expect(nav.links).toHaveLength(4);
    }
  });

  test("the rendered page draws the nav the layout computed", () => {
    const ctx = mockupContext("dark", sixty);
    const nav = landingNav(ctx, 1440);
    const svg = getTemplate("laptop-landing")!.render(ctx);
    for (const link of ["Product", "Pricing", "Docs", "Company"]) {
      expect(svg.includes(`>${link}</text>`)).toBe(nav.links.some((item) => item.label === link));
    }
  });
});
