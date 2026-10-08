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

type TextBox = { value: string; start: number; end: number; baseline: number };

/**
 * The horizontal extent of every top-level `<text>` in a drawing, measured the way the
 * templates measure (ctx.measure, plus letter-spacing). Follows `translate()` groups and
 * skips nested `<svg>` documents such as the logo.
 */
function textBoxes(ctx: SocialContext, svg: string): TextBox[] {
  const unescape = (value: string) =>
    value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
  const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  const boxes: TextBox[] = [];
  // Each open element pushes its x offset, or null inside a nested document.
  const stack: (number | null)[] = [];
  const tag = /<(\/?)([A-Za-z][\w:-]*)([^>]*?)(\/?)>/g;
  for (let match = tag.exec(svg); match; match = tag.exec(svg)) {
    const [, closing, name, attrs = "", selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    const parent = stack.length ? stack[stack.length - 1]! : 0;
    const nested = parent === null || (name === "svg" && stack.length > 0);
    const translate = attr(attrs, "transform")?.match(/^translate\(([-\d.]+)/);
    const offset = nested ? null : (parent ?? 0) + (translate ? Number(translate[1]) : 0);
    if (name === "text" && offset !== null) {
      const close = svg.indexOf("</text>", tag.lastIndex);
      const value = unescape(svg.slice(tag.lastIndex, close));
      const size = Number(attr(attrs, "font-size"));
      const font = attr(attrs, "class");
      const { heading, headingWeight, body } = ctx.brand.typography;
      const family = font === "h" ? heading : font ? body : (attr(attrs, "font-family") ?? body);
      const weight = font === "h" ? headingWeight : font === "bb" ? 600 : Number(attr(attrs, "font-weight") ?? 400);
      const width =
        ctx.measure(value, family, weight, size) + Number(attr(attrs, "letter-spacing") ?? 0) * value.length;
      const x = offset + Number(attr(attrs, "x"));
      const anchor = attr(attrs, "text-anchor") ?? "start";
      const start = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
      boxes.push({ value, start, end: start + width, baseline: Number(attr(attrs, "y")) });
      tag.lastIndex = close + "</text>".length;
      continue;
    }
    if (!selfClosing) stack.push(offset);
  }
  return boxes;
}

describe("long single-word links", () => {
  const word = "northwindanalyticscooperativeforsustainabledatasystems";
  const long = {
    name: "Northwind Analytics Cooperative for Sustainable Data Systems",
    website: `${word}.co.uk`,
    handle: `@${word}teams`,
    github: `${word}studio`,
  };

  function longContext(mode: BrandMode): SocialContext {
    const ctx = socialContext(mode, long.name);
    return { ...ctx, content: { ...ctx.content, ...long } };
  }

  test("the sample values are 60 characters", () => {
    for (const value of Object.values(long)) expect(value).toHaveLength(60);
  });

  test.each(socialTemplates.map((template) => [template.id, template] as const))(
    "%s keeps the website and handle inside the safe area",
    (_id, template) => {
      for (const mode of modes) {
        const ctx = longContext(mode);
        const boxes = textBoxes(ctx, template.render(ctx));
        // Any text that shows part of a link, even shortened with an ellipsis.
        const links = boxes.filter((box) =>
          [long.website, long.handle, long.github].some((value) => box.value.includes(value.slice(0, 12))),
        );
        for (const box of links) {
          expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
          expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
        }
      }
    },
  );

  test.each(socialTemplates.map((template) => [template.id, template] as const))(
    "%s keeps text off the covered zones",
    (_id, template) => {
      for (const mode of modes) {
        const ctx = longContext(mode);
        for (const box of textBoxes(ctx, template.render(ctx))) {
          for (const zone of template.covered ?? []) {
            const inside = box.baseline > zone.y && box.baseline < zone.y + zone.height;
            const overlaps = box.end > zone.x && box.start < zone.x + zone.width;
            expect(inside && overlaps, box.value).toBe(false);
          }
        }
      }
    },
  );

  test.each(socialTemplates.map((template) => [template.id, template] as const))(
    "%s draws short links in full",
    (_id, template) => {
      const ctx = socialContext("light");
      const svg = template.render(ctx);
      for (const value of [ctx.content.website, ctx.content.handle]) {
        const shown = textBoxes(ctx, svg).some((box) => box.value.includes(value));
        // Not every template shows both, but none shortens a short one.
        if (svg.includes(value.slice(0, 6))) expect(shown, value).toBe(true);
      }
    },
  );
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
