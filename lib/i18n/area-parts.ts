import type { Locale } from "@/lib/i18n/locales";
import type { Catalog } from "@/lib/i18n/translate";

/**
 * The other languages' messages of a studio area. English registers an area from the code that uses it
 * (`lib/i18n/areas/<area>.ts`), and that module also says where the area's Spanish, French and Hindi parts are. Once
 * the active language is not English, the parts of the areas that were registered are fetched, so a person reading
 * Hindi who opens the Color Studio downloads the Color Studio's Hindi messages and no other studio's.
 */
type Loaders = Record<Exclude<Locale, "en">, () => Promise<Catalog>>;

const areas = new Map<string, Loaders>();
const requested = new Set<string>();
const merged: Partial<Record<Locale, Record<string, string>>> = {};
let active: Locale = "en";
let version = 0;
const listeners = new Set<() => void>();

function loadActive() {
  if (active === "en") return;
  const locale = active;
  for (const [area, loaders] of areas) {
    const id = `${locale}:${area}`;
    if (requested.has(id)) continue;
    requested.add(id);
    loaders[locale]().then(
      (part) => {
        merged[locale] = { ...merged[locale], ...(part as Record<string, string>) };
        version += 1;
        for (const listener of listeners) listener();
      },
      // A part that did not load (offline) is asked for again the next time the language or an area changes.
      () => requested.delete(id),
    );
  }
}

/** Called by an area's module: the area exists on this page, so its parts are wanted in the active language. */
export function registerAreaLoaders(area: string, loaders: Loaders): void {
  areas.set(area, loaders);
  loadActive();
}

/** Called by the locale provider when the language is chosen or changes. */
export function setActiveLocale(locale: Locale): void {
  active = locale;
  loadActive();
}

/** The area messages loaded so far in a language. */
export const areaMessages = (locale: string): Record<string, string> | undefined => merged[locale as Locale];

export function subscribeAreaParts(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Changes whenever a part has loaded, so a component can read the messages again. */
export const areaPartsVersion = (): number => version;
