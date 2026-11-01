import type { LogoVariantId } from "@/lib/logo/variants";

export type LogoVariantSetId = "colors" | "lockups" | "marks" | "sharing";

/** The label is the English name; the studio shows the translated one, `logo.set.<id>`. */
export type LogoVariantSet = { id: LogoVariantSetId; label: string; variants: LogoVariantId[] };

/**
 * The variants in sets, in the order the Variants view shows them. Every variant belongs to exactly one
 * set (a test checks it), so a new variant must be placed here to appear in the view.
 */
export const logoVariantSets: LogoVariantSet[] = [
  { id: "colors", label: "Colors", variants: ["color", "monochrome", "inverted"] },
  { id: "lockups", label: "Lockups", variants: ["horizontal", "stacked", "wordmark"] },
  { id: "marks", label: "Marks and avatars", variants: ["app-icon", "avatar", "monogram", "seal"] },
  { id: "sharing", label: "Sharing", variants: ["social-share"] },
];
