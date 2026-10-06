import { describe, expect, test } from "vitest";

import { brandSurface } from "@/lib/brand/theme";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { effectTokens } from "@/lib/effects/bundle";
import { guidelinePages } from "@/lib/guidelines/registry";
import { brandSiteFiles, pageBlocks } from "@/lib/guidelines/site";
import type { GuidelineContext } from "@/lib/guidelines/types";
import { measureText } from "@/lib/logo/measure";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { xmlError } from "@/lib/test/xml";
import { buildTokens } from "@/lib/tokens/build";

/** The default brand as the guideline pages see it, built the way the hooks build it. */
function guidelineContext(name: string, excluded: string[]) {
  const { brand, colors, typography, tokens, effects, logo } = defaultSnapshot(name);
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
  const surface = brandSurface(tokensForBrand, "light");
  const pages = guidelinePages.filter((page) => !excluded.includes(page.id));
  const ctx: GuidelineContext = {
    brand: tokensForBrand,
    surface,
    mode: "light",
    fontCss: "",
    measure: measureText,
    voice: brand.profile.voice,
    mission: brand.profile.mission,
    tokens: buildTokens(
      {
        colors: colors.swatches.map((swatch) => swatch.color),
        shadeOptions: colors.shadeOptions,
        gradient: colors.gradient,
        heading: undefined,
        body: undefined,
        scale: typography.scale,
        rhythm: typography.rhythm,
        effects: effectTokens(effects.settings),
      },
      { ...tokens.settings, name },
    ),
    logo: {
      logo: tokensForBrand.logo.svg,
      name,
      fontFamily: tokensForBrand.typography.heading,
      fontWeight: tokensForBrand.typography.headingWeight,
      fontCss: "",
      measure: (text, size) => measureText(text, tokensForBrand.typography.heading, 700, size),
      primary: surface.primary,
      text: surface.text,
      light: surface.background,
      dark: brandSurface(tokensForBrand, "dark").background,
    },
    clearSpace: logo.clearSpace,
    coverStyle: "gradient",
    date: "October 2026",
    contents: pages.map((page, i) => ({ id: page.id, title: page.title, number: i + 1 })),
  };
  return { ctx, pages };
}

function site(excluded: string[] = [], name = "Acme Labs") {
  const { ctx, pages } = guidelineContext(name, excluded);
  const files = new Map(brandSiteFiles(ctx, pages).map((entry) => [entry.name, String(entry.data)]));
  return { files, pages };
}

/** Resolves a relative href against the file that links to it. */
function resolve(from: string, href: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

describe("brand book website", () => {
  test("writes an index.html per included page and leaves switched-off pages out", () => {
    const { files, pages } = site(["imagery", "voice"]);
    const html = [...files.keys()].filter((name) => name.endsWith(".html"));
    expect(html).toHaveLength(pages.length + 1);
    expect(files.has("index.html")).toBe(true);
    expect(files.has("introduction/index.html")).toBe(true);
    expect(files.has("downloads/index.html")).toBe(true);
    expect(files.has("imagery/index.html")).toBe(false);
    expect(files.has("assets/pages/voice.svg")).toBe(false);
    expect(files.get("index.html")).not.toContain("Voice &amp; Tone");
  });

  test("every relative link and image points at a file in the ZIP", () => {
    const { files } = site();
    for (const [name, data] of files) {
      if (!name.endsWith(".html")) continue;
      for (const match of data.matchAll(/(?:href|src)="([^"#]+)"/g)) {
        const target = resolve(name, match[1]!);
        expect(files.has(target), `${name} links to ${match[1]}`).toBe(true);
      }
    }
  });

  test("pages carry their text as HTML headings and paragraphs", () => {
    const { files } = site([], `Tom & Jerry's "<Studio>"`);
    const mission = files.get("mission/index.html") ?? "";
    expect(mission.match(/<h1>/g)).toHaveLength(1);
    expect(mission).toContain("<h1>What Tom &amp; Jerry's &quot;&lt;Studio&gt;&quot; stands for</h1>");
    expect(mission).toContain("<h2>OUR MISSION</h2>");
    expect(mission).toContain('<html lang="en">');
    // The running header and footer are left to the site navigation.
    expect(mission).not.toContain("MISSION &amp; VALUES");
    expect(mission).toContain("<p>01 Craft</p>");
    for (const [name, data] of files) if (name.endsWith(".svg")) expect(xmlError(data), name).toBeNull();
  });
});

describe("co-branding page", () => {
  test("is in the site and its contents, with a placeholder partner, unless switched off", () => {
    const { files } = site();
    const page = files.get("co-branding/index.html") ?? "";
    expect(page).toContain("<h1>Co-branding</h1>");
    expect(page).toContain("<h2>DIVIDER</h2>");
    expect(page).toContain("<h2>SIZE BALANCE</h2>");
    expect(files.get("assets/pages/co-branding.svg")).toContain(">Partner</text>");
    expect(files.get("index.html")).toContain("Co-branding");

    const without = site(["co-branding"]).files;
    expect(without.has("co-branding/index.html")).toBe(false);
    expect(without.get("index.html")).not.toContain("Co-branding");
  });
});

describe("pageBlocks", () => {
  test("joins wrapped lines and items on one baseline", () => {
    const svg = `<svg>
      <text class="h" x="100" y="150" font-size="52" fill="#000">Title</text>
      <text class="bb" x="100" y="250" font-size="13" fill="#000" letter-spacing="2">LABEL</text>
      <text class="b" x="100" y="300" font-size="20" fill="#000">First line</text>
      <text class="b" x="100" y="330" font-size="20" fill="#000">second line &amp; more</text>
      <text class="bb" x="800" y="400" font-size="16" fill="#000">02</text>
      <text class="b" x="850" y="400" font-size="18" fill="#000">Mission</text>
      <text x="0" y="0" font-size="40">Logo text</text>
    </svg>`;
    expect(pageBlocks(svg)).toEqual([
      { tag: "h1", text: "Title" },
      { tag: "h2", text: "LABEL" },
      { tag: "p", text: "First line second line & more" },
      { tag: "p", text: "02 Mission" },
    ]);
  });
});
