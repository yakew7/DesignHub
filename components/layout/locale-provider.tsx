"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import { areaPartsVersion, setActiveLocale, subscribeAreaParts } from "@/lib/i18n/area-parts";
import { defaultLocale, isLocale, loadCatalog, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/locales";
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

function notify() {
  for (const listener of listeners) listener();
}

function setLocale(locale: Locale) {
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
  useEffect(() => {
    let current = true;
    void loadCatalog(locale).then((catalog) => current && setLoadedCatalog({ locale, catalog }));
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

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The current language, a way to change it, and `t` / `plural` to read messages in it. */
export function useI18n(): I18n {
  return useContext(I18nContext);
}
