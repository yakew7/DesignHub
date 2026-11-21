import { en } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";
import { esBrand } from "@/lib/i18n/messages/es-brand";
import { esColors } from "@/lib/i18n/messages/es-colors";
import { esIcons } from "@/lib/i18n/messages/es-icons";
import { esLogo } from "@/lib/i18n/messages/es-logo";
import { esMockups } from "@/lib/i18n/messages/es-mockups";
import { esProjects } from "@/lib/i18n/messages/es-projects";
import { esSocial } from "@/lib/i18n/messages/es-social";
import { esSvg } from "@/lib/i18n/messages/es-svg";
import { fr } from "@/lib/i18n/messages/fr";
import { frBrand } from "@/lib/i18n/messages/fr-brand";
import { frColors } from "@/lib/i18n/messages/fr-colors";
import { frIcons } from "@/lib/i18n/messages/fr-icons";
import { frLogo } from "@/lib/i18n/messages/fr-logo";
import { frMockups } from "@/lib/i18n/messages/fr-mockups";
import { frProjects } from "@/lib/i18n/messages/fr-projects";
import { frSocial } from "@/lib/i18n/messages/fr-social";
import { frSvg } from "@/lib/i18n/messages/fr-svg";
import { hi } from "@/lib/i18n/messages/hi";
import { hiBrand } from "@/lib/i18n/messages/hi-brand";
import { hiColors } from "@/lib/i18n/messages/hi-colors";
import { hiIcons } from "@/lib/i18n/messages/hi-icons";
import { hiLogo } from "@/lib/i18n/messages/hi-logo";
import { hiMockups } from "@/lib/i18n/messages/hi-mockups";
import { hiProjects } from "@/lib/i18n/messages/hi-projects";
import { hiSocial } from "@/lib/i18n/messages/hi-social";
import { hiSvg } from "@/lib/i18n/messages/hi-svg";
import { de } from "@/lib/i18n/messages/de";
import { deBrand } from "@/lib/i18n/messages/de-brand";
import { deColors } from "@/lib/i18n/messages/de-colors";
import { deIcons } from "@/lib/i18n/messages/de-icons";
import { deLogo } from "@/lib/i18n/messages/de-logo";
import { deMockups } from "@/lib/i18n/messages/de-mockups";
import { deProjects } from "@/lib/i18n/messages/de-projects";
import { deSocial } from "@/lib/i18n/messages/de-social";
import { deSvg } from "@/lib/i18n/messages/de-svg";
import type { Locale } from "@/lib/i18n/locales";
import type { Catalog } from "@/lib/i18n/translate";

/** Every language at once, each joined from its parts. Only the tests import this; the app loads the active language alone (`loadCatalog`) and a studio's part with the studio. */
export const catalogs: Record<Locale, Catalog> = {
  en,
  es: { ...es, ...esBrand, ...esColors, ...esIcons, ...esLogo, ...esMockups, ...esProjects, ...esSocial, ...esSvg },
  fr: { ...fr, ...frBrand, ...frColors, ...frIcons, ...frLogo, ...frMockups, ...frProjects, ...frSocial, ...frSvg },
  hi: { ...hi, ...hiBrand, ...hiColors, ...hiIcons, ...hiLogo, ...hiMockups, ...hiProjects, ...hiSocial, ...hiSvg },
  de: { ...de, ...deBrand, ...deColors, ...deIcons, ...deLogo, ...deMockups, ...deProjects, ...deSocial, ...deSvg },
};
