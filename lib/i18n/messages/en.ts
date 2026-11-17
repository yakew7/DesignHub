/**
 * English messages: the source of truth for every key. Other locales may leave keys out and fall
 * back to these. `{name}` is a placeholder, and keys ending in `.one` / `.other` are plural forms
 * (see `plural()` in `lib/i18n/translate.ts`).
 */
import { enBrand } from "@/lib/i18n/messages/en-brand";
import { enColors } from "@/lib/i18n/messages/en-colors";
import { enCore } from "@/lib/i18n/messages/en-core";
import { enIcons } from "@/lib/i18n/messages/en-icons";
import { enLogo } from "@/lib/i18n/messages/en-logo";
import { enMockups } from "@/lib/i18n/messages/en-mockups";
import { enProjects } from "@/lib/i18n/messages/en-projects";
import { enSocial } from "@/lib/i18n/messages/en-social";
import { enSvg } from "@/lib/i18n/messages/en-svg";

/** Every English message. For types and tests: the app itself loads `enCore` and one area at a time. */
export const en = {
  ...enBrand,
  ...enColors,
  ...enCore,
  ...enIcons,
  ...enLogo,
  ...enMockups,
  ...enProjects,
  ...enSocial,
  ...enSvg,
} as const;
