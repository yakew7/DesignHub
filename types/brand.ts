import type { ShadowLayer } from "@/types/effects";
import type { FontCategory, TypeScaleStep } from "@/types/typography";

export type ColorRole = "primary" | "secondary" | "neutral";

export type BrandVoice = {
  personality: string[];
  dos: string[];
  donts: string[];
  sample: string;
};

export type BrandValue = { title: string; description: string };

/** The mission statement and up to four values, shown on the Mission & Values page. */
export type BrandMission = {
  statement: string;
  values: BrandValue[];
};

/** Only what is unique to the brand. Colors, fonts, radius, spacing and shadows live in their own studios. */
export type BrandProfile = {
  name: string;
  description: string;
  /** Uploaded SVG logo, or null to use the generated mark. */
  logoSvg: string | null;
  /** Swatch id → role. Missing entries are inferred. */
  roles: Record<string, ColorRole>;
  voice: BrandVoice;
  mission: BrandMission;
};

export type BrandColor = { id: string; name: string; hex: string; role: ColorRole };

export type BrandTokens = {
  name: string;
  description: string;
  logo: { svg: string; generated: boolean };
  colors: {
    all: BrandColor[];
    primary: string[];
    secondary: string[];
    neutrals: string[];
  };
  typography: {
    heading: string;
    headingCategory: FontCategory;
    body: string;
    bodyCategory: FontCategory;
    headingWeight: number;
    bodyWeight: number;
    headingLineHeight: number;
    bodyLineHeight: number;
    scale: TypeScaleStep[];
  };
  radius: number;
  spacing: number;
  shadow: string;
  shadowLayers: ShadowLayer[];
  gradient: string;
};

export type BrandMode = "light" | "dark";

/** Surface colors derived for one theme, used by every brand preview and export. */
export type BrandSurface = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  /** Primary adjusted to reach 4.5:1 on the background, for small text and links. */
  primaryText: string;
  onPrimary: string;
  secondary: string;
};
