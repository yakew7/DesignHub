import { brandDomain } from "@/lib/brand/domain";
import type { SocialContent } from "@/lib/social/types";
import type { BrandTokens } from "@/types/brand";

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, "");

/** Fills empty fields from the brand, so every asset has sensible copy out of the box. */
export function resolveSocialContent(content: SocialContent, brand: BrandTokens): SocialContent {
  const name = content.name.trim() || brand.name;
  const handle = content.handle.trim() || slug(name).replace(/-/g, "");
  const github = (content.github.trim() || slug(name))
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//, "");
  return {
    ...content,
    name,
    headline: content.headline.trim() || brand.description || name,
    handle: handle.startsWith("@") ? handle : `@${handle}`,
    github,
    website: content.website.trim() || brandDomain(name),
  };
}
