import { en } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";
import type { Catalog } from "@/lib/i18n/translate";

export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const catalogs: Record<Locale, Catalog> = { en, es };

/** Each language in its own name, so people can find theirs whatever the interface shows. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
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
