import { describe, expect, test } from "vitest";

import { brandSurface } from "@/lib/brand/theme";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { measureText } from "@/lib/logo/measure";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { instagramHighlight } from "@/lib/social/templates/instagram-highlight";
import { defaultPackTemplates, packTemplates } from "@/lib/social/pack";
import {
  getSocialTemplate,
  isCoreTemplate,
  matchingSocialTemplates,
  orderedSocialPlatforms,
  socialPlatformGroups,
  socialPlatforms,
  socialTemplates,
} from "@/lib/social/registry";

test("template ids are unique", () => {
  const ids = socialTemplates.map((template) => template.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every template's platform is listed, so the picker and pack show it", () => {
  for (const template of socialTemplates) expect(socialPlatforms).toContain(template.platform);
});

test("safe areas and covered zones fit inside the canvas", () => {
  for (const { id, width, height, safe, covered = [] } of socialTemplates) {
    for (const rect of [safe, ...covered]) {
      expect(rect.x, id).toBeGreaterThanOrEqual(0);
      expect(rect.y, id).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width, id).toBeLessThanOrEqual(width);
      expect(rect.y + rect.height, id).toBeLessThanOrEqual(height);
    }
  }
});

test.each([
  ["twitch-banner", 1200, 480],
  ["mastodon-header", 1500, 500],
  ["instagram-portrait", 1080, 1350],
  ["instagram-highlight", 1080, 1920],
  ["youtube-banner", 2560, 1440],
  ["reddit-banner", 1920, 384],
  ["tumblr-header", 3000, 1055],
  ["dribbble-shot", 1600, 1200],
  ["behance-cover", 808, 632],
  ["patreon-cover", 1600, 400],
  ["kick-banner", 1920, 480],
  ["bandcamp-header", 975, 180],
  ["product-hunt-thumbnail", 240, 240],
  ["twitch-offline", 1920, 1080],
  ["linkedin-event", 1776, 444],
  ["telegram-cover", 1280, 720],
  ["substack-banner", 1100, 220],
  ["ghost-cover", 2000, 1000],
  ["spotify-playlist-cover", 640, 640],
  ["devto-cover", 1000, 420],
  ["hashnode-cover", 1600, 840],
  ["x-post-image", 1600, 900],
  ["pinterest-board-cover", 600, 600],
  ["etsy-shop-banner", 3360, 840],
  ["gumroad-cover", 1280, 420],
  ["kofi-banner", 1920, 480],
  ["buy-me-a-coffee-cover", 1200, 400],
  ["notion-cover", 1500, 600],
  ["medium-banner", 1500, 500],
])("%s is registered at %ix%i and can be added to a pack", (id, width, height) => {
  const template = getSocialTemplate(id);
  expect(template).toMatchObject({ width, height });
  expect(packTemplates(socialTemplates.map((item) => item.id))).toContain(template);
});

const CORE = [
  "GitHub",
  "LinkedIn",
  "X",
  "YouTube",
  "Instagram",
  "Open Graph",
  "Product Hunt",
  "Facebook",
  "Bluesky",
  "Discord",
  "Twitch",
  "Mastodon",
  "Medium",
  "Substack",
  "DEV",
  "Hashnode",
  "Pinterest",
  "Notion",
  "Reddit",
  "Telegram",
];

test("every listed platform has a group, and the core group is the twenty main platforms", () => {
  expect(Object.keys(socialPlatformGroups).sort()).toEqual([...socialPlatforms].sort());
  for (const platform of socialPlatforms) expect(["core", "more"], platform).toContain(socialPlatformGroups[platform]);
  const core = socialPlatforms.filter((platform) => socialPlatformGroups[platform] === "core");
  expect([...core].sort()).toEqual([...CORE].sort());
});

test("the picker lists core platforms first, then the rest, without dropping any", () => {
  expect([...orderedSocialPlatforms].sort()).toEqual([...socialPlatforms].sort());
  const groups = orderedSocialPlatforms.map((platform) => socialPlatformGroups[platform]);
  expect(groups.indexOf("more")).toBe(groups.lastIndexOf("core") + 1);
});

test("the default pack holds only core templates, and a saved selection can add any other", () => {
  const defaults = packTemplates(null);
  expect(defaults.length).toBeGreaterThan(0);
  expect(defaults).toEqual(defaultPackTemplates());
  expect(defaults.every(isCoreTemplate)).toBe(true);
  const more = socialTemplates.filter((template) => !isCoreTemplate(template));
  expect(more.length).toBeGreaterThan(0);
  for (const template of more) expect(defaults).not.toContain(template);
  const kick = getSocialTemplate("kick-banner")!;
  expect(packTemplates([...defaults.map((item) => item.id), kick.id])).toContain(kick);
  expect(packTemplates([kick.id])).toEqual([kick]);
});

test("no template id changed, so saved selections keep working", () => {
  for (const id of ["github-classic", "instagram-square", "kofi-banner", "kick-banner", "etsy-shop-banner"]) {
    expect(getSocialTemplate(id), id).toBeDefined();
  }
});

test("the highlight cover shortens a long label to 12 characters", () => {
  const { brand, colors, typography, tokens, effects, social } = defaultSnapshot();
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
  const svg = instagramHighlight.render({
    brand: tokensForBrand,
    surface: brandSurface(tokensForBrand, "light"),
    mode: "light",
    fontCss: "",
    measure: measureText,
    content: { ...social.content, name: "Brand", cta: "A very long highlight label indeed" },
    layout: { padding: social.design.padding, background: social.design.background },
  });
  expect(svg).toContain("A very long…");
  expect(svg).not.toContain("highlight label");
});

describe("social template search", () => {
  test("nothing typed shows everything", () => {
    expect(matchingSocialTemplates("")).toBeNull();
    expect(matchingSocialTemplates("   ")).toBeNull();
  });

  test("finds a template by its name, platform and size", () => {
    expect(matchingSocialTemplates("story")?.has("instagram-story")).toBe(true);
    expect(matchingSocialTemplates("highlight")?.has("instagram-highlight")).toBe(true);
    const og = matchingSocialTemplates("1200x630");
    expect(og && og.size).toBeGreaterThan(0);
    for (const id of og ?? []) {
      const template = getSocialTemplate(id)!;
      expect(`${template.width}x${template.height}`).toBe("1200x630");
    }
    for (const id of matchingSocialTemplates("kick") ?? []) expect(getSocialTemplate(id)!.platform).toBe("Kick");
  });

  test("finds a template by a word of its English description and of its translated one", () => {
    expect(matchingSocialTemplates("frosted")?.has("github-glass")).toBe(true);
    expect(matchingSocialTemplates("frosted")?.has("github-minimal")).toBe(false);
    const translated = (template: { id: string }) => (template.id === "github-glass" ? "paneles esmerilados" : "");
    expect([...(matchingSocialTemplates("esmerilados", undefined, translated) ?? [])]).toEqual(["github-glass"]);
    expect(matchingSocialTemplates("frosted", undefined, translated)?.has("github-glass")).toBe(true);
  });

  test("a search with no match is an empty set, not null", () => {
    expect(matchingSocialTemplates("zzzzzz")?.size).toBe(0);
  });
});
