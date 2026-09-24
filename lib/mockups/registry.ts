import { businessCard } from "@/lib/mockups/templates/business-card";
import { desktopDashboard } from "@/lib/mockups/templates/desktop-dashboard";
import { envelope } from "@/lib/mockups/templates/envelope";
import { letterhead } from "@/lib/mockups/templates/letterhead";
import { laptopLanding } from "@/lib/mockups/templates/laptop-landing";
import { merch } from "@/lib/mockups/templates/merch";
import { mobileApp } from "@/lib/mockups/templates/mobile-app";
import { poster } from "@/lib/mockups/templates/poster";
import { sticker } from "@/lib/mockups/templates/sticker";
import type { MockupTemplate } from "@/lib/mockups/types";

/** Templates register here as they are implemented. */
export const mockupTemplates: MockupTemplate[] = [
  businessCard,
  letterhead,
  envelope,
  sticker,
  poster,
  merch,
  laptopLanding,
  desktopDashboard,
  mobileApp,
];

export function getTemplate(id: string): MockupTemplate | undefined {
  return mockupTemplates.find((template) => template.id === id);
}
