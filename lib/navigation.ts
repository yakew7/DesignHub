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

import { en } from "@/lib/i18n/messages/en";

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
  /** English, for metadata and the sitemap. The UI translates `studio.<id>.title` instead. */
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
    title: en["studio.brand.title"],
    href: "/brand",
    description: en["studio.brand.description"],
    icon: BadgeCheck,
    shortcut: "r",
    group: "Brand",
  },
  {
    id: "brand-dna",
    title: en["studio.brand-dna.title"],
    href: "/brand-dna",
    description: en["studio.brand-dna.description"],
    icon: Dna,
    shortcut: "d",
    group: "Brand",
  },
  {
    id: "logo",
    title: en["studio.logo.title"],
    href: "/logo",
    description: en["studio.logo.description"],
    icon: Hexagon,
    shortcut: "l",
    group: "Brand",
  },
  {
    id: "mockups",
    title: en["studio.mockups.title"],
    href: "/mockups",
    description: en["studio.mockups.description"],
    icon: Presentation,
    shortcut: "m",
    group: "Brand",
  },
  {
    id: "social",
    title: en["studio.social.title"],
    href: "/social",
    description: en["studio.social.description"],
    icon: Megaphone,
    shortcut: "o",
    group: "Brand",
  },
  {
    id: "guidelines",
    title: en["studio.guidelines.title"],
    href: "/guidelines",
    description: en["studio.guidelines.description"],
    icon: BookOpen,
    shortcut: "u",
    group: "Brand",
  },
  {
    id: "projects",
    title: en["studio.projects.title"],
    href: "/projects",
    description: en["studio.projects.description"],
    icon: FolderOpen,
    shortcut: "p",
    group: "Brand",
  },
  {
    id: "typography",
    title: en["studio.typography.title"],
    href: "/typography",
    description: en["studio.typography.description"],
    icon: Type,
    shortcut: "t",
    group: "Design",
  },
  {
    id: "colors",
    title: en["studio.colors.title"],
    href: "/colors",
    description: en["studio.colors.description"],
    icon: Palette,
    shortcut: "c",
    group: "Design",
  },
  {
    id: "icons",
    title: en["studio.icons.title"],
    href: "/icons",
    description: en["studio.icons.description"],
    icon: Shapes,
    shortcut: "i",
    group: "Design",
  },
  {
    id: "backgrounds",
    title: en["studio.backgrounds.title"],
    href: "/backgrounds",
    description: en["studio.backgrounds.description"],
    icon: Wallpaper,
    shortcut: "b",
    group: "Design",
  },
  {
    id: "effects",
    title: en["studio.effects.title"],
    href: "/effects",
    description: en["studio.effects.description"],
    icon: Sparkles,
    shortcut: "f",
    group: "Design",
  },
  {
    id: "svg",
    title: en["studio.svg.title"],
    href: "/svg",
    description: en["studio.svg.description"],
    icon: PenTool,
    shortcut: "s",
    group: "Tools",
  },
  {
    id: "accessibility",
    title: en["studio.accessibility.title"],
    href: "/accessibility",
    description: en["studio.accessibility.description"],
    icon: Accessibility,
    shortcut: "a",
    group: "Tools",
  },
  {
    id: "export",
    title: en["studio.export.title"],
    href: "/export",
    description: en["studio.export.description"],
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
