"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { catalogs, defaultLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/locales";
import { preferredLocale, writeStoredLocale } from "@/lib/i18n/storage";
import { createTranslator, type Translate, type TranslatePlural } from "@/lib/i18n/translate";

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

function i18nFor(locale: Locale): I18n {
  return { locale, setLocale, ...createTranslator(catalogs[locale], locale) };
}

const I18nContext = createContext<I18n>(i18nFor(defaultLocale));

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo(() => i18nFor(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The current language, a way to change it, and `t` / `plural` to read messages in it. */
export function useI18n(): I18n {
  return useContext(I18nContext);
}
