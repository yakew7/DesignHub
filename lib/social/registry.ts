import { matchesQuery } from "@/lib/picker-search";
import { socialLoaders } from "@/lib/social/loaders";
import socialTemplateInfo from "@/lib/social/template-info.json";
import type { SocialPlatform, SocialTemplate, SocialTemplateInfo } from "@/lib/social/types";

/**
 * Every template as a light list (id, platform, size, safe area), in picker order. The drawing code of a
 * template is loaded with `loadSocialTemplate`. `template-info.json` is written from the full list by
 * `lib/social/template-info.test.ts` (run `pnpm test -u` after adding or changing a template).
 */
export const socialTemplates = socialTemplateInfo as SocialTemplateInfo[];

export const socialPlatforms: SocialPlatform[] = [
  "GitHub",
  "LinkedIn",
  "X",
  "Instagram",
  "Open Graph",
  "Product Hunt",
  "YouTube",
  "Pinterest",
  "Bluesky",
  "Facebook",
  "Discord",
  "Twitch",
  "Mastodon",
  "Reddit",
  "Tumblr",
  "Dribbble",
  "Behance",
  "Patreon",
  "Kick",
  "Bandcamp",
  "Telegram",
  "Substack",
  "Ghost",
  "Spotify",
  "DEV",
  "Hashnode",
  "Etsy",
  "Gumroad",
  "Ko-fi",
  "Buy Me a Coffee",
  "Notion",
  "Medium",
];

export type SocialPlatformGroup = "core" | "more";

/**
 * Where each platform sits in the picker and the default pack. Core platforms are shown first and go
 * into the default ZIP; the rest are under "More platforms" and are added to a pack by choice. A new
 * platform must be listed here (the record is exhaustive), so it is a deliberate decision.
 */
export const socialPlatformGroups: Record<SocialPlatform, SocialPlatformGroup> = {
  GitHub: "core",
  LinkedIn: "core",
  X: "core",
  Instagram: "core",
  "Open Graph": "core",
  "Product Hunt": "core",
  YouTube: "core",
  Pinterest: "core",
  Bluesky: "core",
  Facebook: "core",
  Discord: "core",
  Twitch: "core",
  Mastodon: "core",
  Reddit: "core",
  Telegram: "core",
  Substack: "core",
  DEV: "core",
  Hashnode: "core",
  Notion: "core",
  Medium: "core",
  Tumblr: "more",
  Dribbble: "more",
  Behance: "more",
  Patreon: "more",
  Kick: "more",
  Bandcamp: "more",
  Ghost: "more",
  Spotify: "more",
  Etsy: "more",
  Gumroad: "more",
  "Ko-fi": "more",
  "Buy Me a Coffee": "more",
};

/** Platforms in picker order: the core ones first, then the rest, each in registry order. */
export const orderedSocialPlatforms: SocialPlatform[] = [
  ...socialPlatforms.filter((platform) => socialPlatformGroups[platform] === "core"),
  ...socialPlatforms.filter((platform) => socialPlatformGroups[platform] === "more"),
];

export function isCoreTemplate(template: SocialTemplateInfo): boolean {
  return socialPlatformGroups[template.platform] === "core";
}

/** Ids from earlier versions, so saved selections keep working. */
const aliases: Record<string, string> = { "github-banner": "github-classic" };

export function getSocialTemplate(id: string): SocialTemplateInfo | undefined {
  const target = aliases[id] ?? id;
  return socialTemplates.find((template) => template.id === target);
}

/**
 * What a person can type to find a template: its name, its platform, its size ("1200x630"), its style and group.
 * `translated` is the name and `translatedDescription` the description in the chosen language, so a search finds a
 * template by those words and by the English ones.
 */
export function socialSearchItem(template: SocialTemplateInfo, translated = "", translatedDescription = "") {
  return {
    id: template.id,
    label: `${template.label} ${translated}`.trim(),
    description: `${template.description} ${translatedDescription}`.trim(),
    keywords: `${template.platform} ${template.width}x${template.height} ${template.width} x ${template.height} ${template.group ?? ""} ${template.style ?? ""}`,
  };
}

/** The ids of the templates a search matches, or null when nothing is typed (everything is shown). */
export function matchingSocialTemplates(
  query: string,
  translatedName?: (template: SocialTemplateInfo) => string,
  translatedDescription?: (template: SocialTemplateInfo) => string,
): Set<string> | null {
  if (!query.trim()) return null;
  return new Set(
    socialTemplates
      .filter((template) =>
        matchesQuery(socialSearchItem(template, translatedName?.(template), translatedDescription?.(template)), query),
      )
      .map((template) => template.id),
  );
}

/** A template with its drawing code, fetched the first time it is asked for and kept after that. */
export function loadSocialTemplate(id: string): Promise<SocialTemplate | undefined> {
  const target = aliases[id] ?? id;
  const load = socialLoaders[target];
  if (!load) return Promise.resolve(undefined);
  let loaded = loadedSocial.get(target);
  if (!loaded) {
    loaded = load();
    loadedSocial.set(target, loaded);
  }
  return loaded;
}

const loadedSocial = new Map<string, Promise<SocialTemplate>>();
