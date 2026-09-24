import type { Rect } from "@/lib/logo/compose";
import type { DrawContext } from "@/lib/mockups/types";

export type SocialContent = {
  /** Project name. Empty uses the brand name. */
  name: string;
  /** Description or headline. Empty uses the brand description. */
  headline: string;
  subtitle: string;
  handle: string;
  /** GitHub username or organization, without "@". Empty is derived from the brand name. */
  github: string;
  website: string;
  cta: string;
};

/** Overrides the brand's background treatment. "auto" keeps each template's own design. */
export type SocialBackground = "auto" | "solid" | "gradient" | "glow" | "mesh";

/** Look-and-feel overrides shared by every template. Null means "use the brand". */
export type SocialDesign = {
  primary: string | null;
  secondary: string | null;
  background: SocialBackground;
  radius: number | null;
  padding: number;
  /** A logo just for social assets (sanitized SVG). Null uses the brand logo. */
  logoSvg: string | null;
};

export type SocialContext = DrawContext & {
  content: SocialContent;
  layout: { padding: number; background: SocialBackground };
};

export type SocialPlatform =
  "GitHub" | "LinkedIn" | "X" | "Instagram" | "Open Graph" | "Product Hunt" | "YouTube" | "Pinterest";

export type SocialTemplate = {
  id: string;
  platform: SocialPlatform;
  label: string;
  width: number;
  height: number;
  description: string;
  /** Templates that share a group are styles of one asset, shown nested in the picker. */
  group?: string;
  /** Style name inside the group, e.g. "Minimal". */
  style?: string;
  /** Area every platform crop keeps visible. Content should stay inside it. */
  safe: Rect;
  /** Areas covered by platform UI (profile photo, timestamps). */
  covered?: Rect[];
  render: (ctx: SocialContext) => string;
};
