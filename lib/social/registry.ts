import { githubBannerStyles } from "@/lib/social/templates/github";
import { instagramSquare, instagramStory } from "@/lib/social/templates/instagram";
import { linkedinCover } from "@/lib/social/templates/linkedin-cover";
import { ogTemplates } from "@/lib/social/templates/open-graph";
import { pinterestPin } from "@/lib/social/templates/pinterest";
import { productHuntGallery, youtubeThumbnail } from "@/lib/social/templates/product-hunt";
import { xBanner } from "@/lib/social/templates/x-banner";
import type { SocialPlatform, SocialTemplate } from "@/lib/social/types";

/** Templates register here as they are implemented. */
export const socialTemplates: SocialTemplate[] = [
  ...githubBannerStyles,
  linkedinCover,
  xBanner,
  instagramSquare,
  instagramStory,
  ...ogTemplates,
  productHuntGallery,
  youtubeThumbnail,
  pinterestPin,
];

export const socialPlatforms: SocialPlatform[] = [
  "GitHub",
  "LinkedIn",
  "X",
  "Instagram",
  "Open Graph",
  "Product Hunt",
  "YouTube",
  "Pinterest",
];

/** Ids from earlier versions, so saved selections keep working. */
const aliases: Record<string, string> = { "github-banner": "github-classic" };

export function getSocialTemplate(id: string): SocialTemplate | undefined {
  const target = aliases[id] ?? id;
  return socialTemplates.find((template) => template.id === target);
}
