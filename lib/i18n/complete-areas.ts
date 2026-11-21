import { locales, type Locale } from "@/lib/i18n/locales";

/**
 * Key prefixes that are translated completely in every language. A missing translation falls back
 * to English, which is fine while an area is being translated, so an area only joins this list
 * once es, fr and hi all have every one of its keys. After that the tests fail when a key goes
 * missing, and name it. See docs/translating.md.
 */
export const completeAreas = [
  "a11y.",
  "brand.",
  "code.",
  "colors.",
  "command.",
  "common.",
  "compare.",
  "copy.",
  "effects.",
  "error.",
  "history.",
  "home.",
  "icons.",
  "language.",
  "logo.",
  "mockups.",
  "mode.",
  "launch.",
  "nav.",
  "projects.",
  "search.",
  "share.",
  "shortcuts.",
  "social.",
  "studio.",
  "svg.",
  "theme.",
  "typography.",
] as const;

/**
 * Languages that are added but not translated yet. Every key of one shows in English (the fallback), so the tests
 * that need a language to be complete skip them. Remove a language from this list when its complete areas are
 * translated, and the tests start to hold it to every key. `pnpm new:language` adds a new language here.
 */
export const languagesInProgress: readonly Locale[] = ["de"];

/** The languages the completeness tests hold to every key: English, and every language not in progress. */
export const finishedLocales: readonly Locale[] = locales.filter((locale) => !languagesInProgress.includes(locale));
