import {
  accessibilityPage,
  colorPalettePage,
  componentsPage,
  iconographyPage,
  typographyPage,
} from "@/lib/guidelines/pages/foundations";
import { coBrandingPage } from "@/lib/guidelines/pages/co-branding";
import { imageryPage, socialMediaPage } from "@/lib/guidelines/pages/imagery";
import { coverPage, introductionPage, voicePage } from "@/lib/guidelines/pages/intro";
import { missionPage } from "@/lib/guidelines/pages/mission";
import { clearSpacePage, incorrectUsagePage, logoUsagePage, minimumSizePage } from "@/lib/guidelines/pages/logo";
import { colorTokensPage, scaleTokensPage } from "@/lib/guidelines/pages/tokens";
import type { GuidelinePage } from "@/lib/guidelines/types";

/** Pages in book order. */
export const guidelinePages: GuidelinePage[] = [
  coverPage,
  introductionPage,
  missionPage,
  logoUsagePage,
  clearSpacePage,
  minimumSizePage,
  incorrectUsagePage,
  coBrandingPage,
  colorPalettePage,
  typographyPage,
  iconographyPage,
  imageryPage,
  componentsPage,
  accessibilityPage,
  voicePage,
  socialMediaPage,
  colorTokensPage,
  scaleTokensPage,
];

export function getGuidelinePage(id: string): GuidelinePage | undefined {
  return guidelinePages.find((page) => page.id === id);
}
