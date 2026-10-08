import { isLocale, LOCALE_STORAGE_KEY, resolveLocale, type Locale } from "@/lib/i18n/locales";

/** The viewer's saved choice, or null. Reads defensively: blocked site data throws on access. */
export function readStoredLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage is blocked or full; the language still changes, it just won't be remembered.
  }
}

/** The saved choice, else the first browser language with a translation, else English. */
export function preferredLocale(): Locale {
  return readStoredLocale() ?? resolveLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}
