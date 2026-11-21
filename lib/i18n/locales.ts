import type { Catalog } from "@/lib/i18n/translate";

export const locales = ["en", "es", "fr", "hi", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** English is always loaded (it is the fallback for every key), so it needs no catalog of its own. */
const loaders: Record<Exclude<Locale, "en">, () => Promise<Catalog>> = {
  es: () => import("@/lib/i18n/messages/es").then((module) => module.es),
  fr: () => import("@/lib/i18n/messages/fr").then((module) => module.fr),
  hi: () => import("@/lib/i18n/messages/hi").then((module) => module.hi),
  de: () => import("@/lib/i18n/messages/de").then((module) => module.de),
};

const loaded = new Map<Locale, Promise<Catalog>>();

/** The messages of one language, fetched the first time it is asked for. English is empty: it is the fallback. */
export function loadCatalog(locale: Locale): Promise<Catalog> {
  if (locale === "en") return Promise.resolve({});
  let catalog = loaded.get(locale);
  if (!catalog) {
    catalog = loaders[locale]();
    loaded.set(locale, catalog);
  }
  return catalog;
}

/** Each language in its own name, so people can find theirs whatever the interface shows. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  de: "Deutsch",
};

/** Per-viewer UI setting, so it lives in localStorage rather than the IndexedDB stores. */
export const LOCALE_STORAGE_KEY = "designhub:locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * The first browser language DesignHub has a translation for, matched on the language part
 * ("es-MX" picks "es"), or English when none matches.
 */
export function resolveLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
