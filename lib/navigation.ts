import {
  Accessibility,
  BadgeCheck,
  BookOpen,
  FolderOpen,
  Hexagon,
  Megaphone,
  Presentation,
  Braces,
  Dna,
  Palette,
  PenTool,
  Shapes,
  Sparkles,
  Type,
  Wallpaper,
  type LucideIcon,
} from "lucide-react";

export const studioIds = [
  "brand",
  "brand-dna",
  "logo",
  "mockups",
  "social",
  "guidelines",
  "projects",
  "typography",
  "colors",
  "icons",
  "backgrounds",
  "effects",
  "svg",
  "accessibility",
  "export",
] as const;

export type StudioId = (typeof studioIds)[number];

export type StudioGroup = "Brand" | "Design" | "Tools";

export const studioGroups: readonly StudioGroup[] = ["Brand", "Design", "Tools"];

export type StudioNavItem = {
  id: StudioId;
  title: string;
  href: `/${string}`;
  description: string;
  icon: LucideIcon;
  /** Single-key shortcut used after pressing `g` (e.g. `g t`). */
  shortcut: string;
  group: StudioGroup;
};

export const studios: readonly StudioNavItem[] = [
  {
    id: "brand",
    title: "Brand Studio",
    href: "/brand",
    description: "The hub of your identity: name, logo, colors, type, radius, spacing and shadows, synced everywhere.",
    icon: BadgeCheck,
    shortcut: "r",
    group: "Brand",
  },
  {
    id: "brand-dna",
    title: "Brand DNA",
    href: "/brand-dna",
    description:
      "Extract a palette, mood and type pairing from any image and apply it to your brand. Runs on your device.",
    icon: Dna,
    shortcut: "d",
    group: "Brand",
  },
  {
    id: "logo",
    title: "Logo Studio",
    href: "/logo",
    description: "Edit your SVG logo, check construction and clear space, generate variants and export a logo pack.",
    icon: Hexagon,
    shortcut: "l",
    group: "Brand",
  },
  {
    id: "mockups",
    title: "Mockup Studio",
    href: "/mockups",
    description: "Business cards, stationery, posters, websites, dashboards and apps, drawn live from your brand.",
    icon: Presentation,
    shortcut: "m",
    group: "Brand",
  },
  {
    id: "social",
    title: "Social Media Studio",
    href: "/social",
    description: "Banners, covers, OG images and thumbnails for every platform, generated from your brand.",
    icon: Megaphone,
    shortcut: "o",
    group: "Brand",
  },
  {
    id: "guidelines",
    title: "Brand Guidelines",
    href: "/guidelines",
    description:
      "A complete brand book, from logo usage to design tokens, generated from your brand and exported as PDF.",
    icon: BookOpen,
    shortcut: "u",
    group: "Brand",
  },
  {
    id: "projects",
    title: "Brand Projects",
    href: "/projects",
    description:
      "Keep several brands side by side. Everything saves locally in your browser; import and export as JSON.",
    icon: FolderOpen,
    shortcut: "p",
    group: "Brand",
  },
  {
    id: "typography",
    title: "Typography Studio",
    href: "/typography",
    description: "Browse Google Fonts, pair typefaces and generate fluid type scales.",
    icon: Type,
    shortcut: "t",
    group: "Design",
  },
  {
    id: "colors",
    title: "Color Studio",
    href: "/colors",
    description: "Generate palettes, shades and gradients. Check contrast in OKLCH.",
    icon: Palette,
    shortcut: "c",
    group: "Design",
  },
  {
    id: "icons",
    title: "Icon Studio",
    href: "/icons",
    description: "Search 200,000+ open source icons. Restyle and export to SVG, React, PNG or ICO.",
    icon: Shapes,
    shortcut: "i",
    group: "Design",
  },
  {
    id: "backgrounds",
    title: "Background Studio",
    href: "/backgrounds",
    description: "Procedural waves, blobs, mesh gradients, aurora, noise and patterns. Export SVG, PNG or CSS.",
    icon: Wallpaper,
    shortcut: "b",
    group: "Design",
  },
  {
    id: "effects",
    title: "Effects Lab",
    href: "/effects",
    description:
      "Glass, neumorphism, layered and inner shadows, glows, gradient borders and grain - as CSS and Tailwind.",
    icon: Sparkles,
    shortcut: "f",
    group: "Design",
  },
  {
    id: "svg",
    title: "SVG Playground",
    href: "/svg",
    description: "Inspect, edit and optimize SVG. Convert to JSX, React, React Native, Vue, Svelte or a sprite sheet.",
    icon: PenTool,
    shortcut: "s",
    group: "Tools",
  },
  {
    id: "accessibility",
    title: "Accessibility Lab",
    href: "/accessibility",
    description: "WCAG contrast, color vision simulation, readability, dyslexia preview and touch-target checks.",
    icon: Accessibility,
    shortcut: "a",
    group: "Tools",
  },
  {
    id: "export",
    title: "Export Engine",
    href: "/export",
    description: "Turn your choices into design tokens for CSS, SCSS, Tailwind, React and JSON.",
    icon: Braces,
    shortcut: "e",
    group: "Tools",
  },
] as const;

export function getStudio(id: StudioId): StudioNavItem {
  const studio = studios.find((item) => item.id === id);
  if (!studio) throw new Error(`Unknown studio: ${id}`);
  return studio;
}

/** Exact match or a child route, so "/brand" doesn't also light up "/brand-dna". */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
