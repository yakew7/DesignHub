import type { BrandMission, BrandTokens, BrandVoice } from "@/types/brand";

export const BRAND_JSON_VERSION = 1;

/** A portable, human-readable description of the brand. */
export function brandJson(tokens: BrandTokens, voice: BrandVoice, mission: BrandMission): string {
  const document = {
    format: "designhub.brand",
    version: BRAND_JSON_VERSION,
    name: tokens.name,
    description: tokens.description,
    logo: { generated: tokens.logo.generated, svg: tokens.logo.svg },
    colors: {
      primary: tokens.colors.primary,
      secondary: tokens.colors.secondary,
      neutral: tokens.colors.neutrals,
      palette: tokens.colors.all.map(({ name, hex, role }) => ({ name, hex, role })),
      gradient: tokens.gradient,
    },
    typography: {
      heading: {
        family: tokens.typography.heading,
        category: tokens.typography.headingCategory,
        weight: tokens.typography.headingWeight,
      },
      body: {
        family: tokens.typography.body,
        category: tokens.typography.bodyCategory,
        weight: tokens.typography.bodyWeight,
      },
      lineHeight: { heading: tokens.typography.headingLineHeight, body: tokens.typography.bodyLineHeight },
      scale: Object.fromEntries(tokens.typography.scale.map((step) => [step.name, step.clamp])),
    },
    radius: `${tokens.radius}px`,
    spacing: `${tokens.spacing}px`,
    shadow: tokens.shadow,
    voice,
    mission,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}
