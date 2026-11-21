"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import { languagesInProgress } from "@/lib/i18n/complete-areas";
import { areaPartsVersion, setActiveLocale, subscribeAreaParts } from "@/lib/i18n/area-parts";
import { defaultLocale, isLocale, loadCatalog, LOCALE_STORAGE_KEY, localeNames, type Locale } from "@/lib/i18n/locales";
import { preferredLocale, writeStoredLocale } from "@/lib/i18n/storage";
import { createTranslator, type Catalog, type Translate, type TranslatePlural } from "@/lib/i18n/translate";

type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  plural: TranslatePlural;
};

const listeners = new Set<() => void>();
// Remembers a choice made in this tab even when storage is blocked.
let chosen: Locale | null = null;
// The language a person has just chosen and that has not been announced yet. The announcement waits for the language's
// core messages, and only a choice made here sets it: the language a page opens in is not announced.
let toAnnounce: Locale | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function setLocale(locale: Locale) {
  if (locale !== getSnapshot()) toAnnounce = locale;
  chosen = locale;
  writeStoredLocale(locale);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab switched language, or the browser's languages changed.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOCALE_STORAGE_KEY) return;
    chosen = isLocale(event.newValue) ? event.newValue : null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("languagechange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("languagechange", listener);
  };
}

const getSnapshot = (): Locale => chosen ?? preferredLocale();
// The server (and static prerendering) always renders English, so hydration matches; React then
// re-renders with the viewer's language straight after.
const getServerSnapshot = (): Locale => defaultLocale;

function i18nFor(locale: Locale, catalog: Catalog = {}, reading: Locale = locale): I18n {
  // `reading` is the language the messages are in: English until the chosen language has loaded.
  return { locale, setLocale, ...createTranslator(catalog, reading) };
}

const I18nContext = createContext<I18n>(i18nFor(defaultLocale));

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The chosen language's messages load when it is chosen. Until they arrive, English shows, which is also what
  // the prerendered page shows, so only the active language is ever downloaded.
  const [loadedCatalog, setLoadedCatalog] = useState<{ locale: Locale; catalog: Catalog }>({
    locale: defaultLocale,
    catalog: {},
  });
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    let current = true;
    void loadCatalog(locale).then((catalog) => {
      if (!current) return;
      setLoadedCatalog({ locale, catalog });
      // Once the core messages are in, say the new language's own name, once. The studio parts that follow are not announced.
      if (toAnnounce === locale) {
        toAnnounce = null;
        setAnnouncement(localeNames[locale]);
      }
    });
    return () => {
      current = false;
    };
  }, [locale]);
  // The studio areas' messages in this language load as the areas appear (lib/i18n/area-parts.ts); the translator is
  // made again each time one arrives, so the text on the page changes from English to the language.
  useEffect(() => setActiveLocale(locale), [locale]);
  const partsVersion = useSyncExternalStore(subscribeAreaParts, areaPartsVersion, () => 0);
  const value = useMemo(
    () =>
      loadedCatalog.locale === locale ? i18nFor(locale, loadedCatalog.catalog) : i18nFor(locale, {}, defaultLocale),
    // `partsVersion` is not read inside: it only asks for a new translator when a part has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, loadedCatalog, partsVersion],
  );

  // The page's `lang` is the language its text is in. It changes when the new language's core messages arrive, together
  // with the announcement, so a screen reader does not read English text in the new voice while they load.
  // A language still in progress shows English text, so the document says English until it is translated.
  const textLocale = languagesInProgress.includes(loadedCatalog.locale) ? defaultLocale : loadedCatalog.locale;
  useEffect(() => {
    document.documentElement.lang = textLocale;
  }, [textLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
      {/* In the new language, so it is read in that voice. Always in the page, because a live region that appears
          together with its text is often not announced. */}
      <div
        // role="status" is polite and atomic on its own; the attributes are left off so that the studios' own live
        // regions, which tests and tools find by them, stay the only ones with them.
        role="status"
        lang={textLocale}
        className="sr-only"
        data-testid="language-announcement"
      >
        {announcement}
      </div>
    </I18nContext.Provider>
  );
}

/** The current language, a way to change it, and `t` / `plural` to read messages in it. */
export function useI18n(): I18n {
  return useContext(I18nContext);
}
