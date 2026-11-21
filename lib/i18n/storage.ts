import { languagesInProgress } from "@/lib/i18n/complete-areas";
import { isLocale, LOCALE_STORAGE_KEY, resolveLocale, type Locale } from "@/lib/i18n/locales";

/** The viewer's saved choice, or null. Reads defensively: blocked site data throws on access. */
function readStoredLocale(): Locale | null {
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

/**
 * The browser languages that are worth choosing for the person: a language still in progress (see
 * `languagesInProgress`) has no translation yet, so a browser set to it is not switched to it on its own. It can
 * still be chosen in the language switcher.
 */
export function detectableLanguages(languages: readonly string[]): string[] {
  return languages.filter((language) => {
    const base = language.toLowerCase().split("-")[0];
    return !(languagesInProgress as readonly string[]).includes(base ?? "");
  });
}

/** The saved choice, else the first browser language with a translation, else English. */
export function preferredLocale(): Locale {
  return (
    readStoredLocale() ??
    resolveLocale(detectableLanguages(navigator.languages?.length ? navigator.languages : [navigator.language]))
  );
}
