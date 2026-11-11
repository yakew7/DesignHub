import type { en } from "@/lib/i18n/messages/en";
import { enCore } from "@/lib/i18n/messages/en-core";

type Messages = typeof en;

/**
 * The English messages the page has loaded: the core ones, and each studio area once its route has loaded it
 * (a studio imports lib/i18n/areas/<area>.ts). English is the fallback for every language, so a key must be here before it is asked for.
 */
const english: Record<string, string> = { ...enCore };

/** Adds the messages of a loaded area. */
export function registerEnglish(part: Readonly<Record<string, string>>): void {
  Object.assign(english, part);
}

/** True when an English message with this key has been loaded. */
export function hasEnglish(key: string): boolean {
  return Object.hasOwn(english, key);
}

/** The English text of a key (its key when its area is not loaded, which a studio's route prevents). */
export function englishText(key: MessageKey): string {
  return english[key] ?? key;
}
export type MessageKey = keyof Messages;

/** A translation: any subset of the English keys. Missing keys fall back to English. */
export type Catalog = { readonly [K in MessageKey]?: string };

/** The `{name}` placeholders in a message, read from its English text. */
type Placeholders<S extends string> = S extends `${string}{${infer P}}${infer Rest}` ? P | Placeholders<Rest> : never;

type Params<P extends string> = [P] extends [never] ? [] : [params: Record<P, string | number>];

/** Extra arguments for `t(key, ...)`: none, or exactly the placeholders the message uses. */
export type TranslateArgs<K extends MessageKey> = Params<Placeholders<Messages[K]>>;

/** Keys with no placeholders, usable where only a key can be passed (for example `<Message id>`). */
export type PlainMessageKey = { [K in MessageKey]: TranslateArgs<K> extends [] ? K : never }[MessageKey];

/** The base of every plural message, for which both `<base>.one` and `<base>.other` exist. */
type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}.other` ? (`${Base}.one` extends MessageKey ? Base : never) : never;
}[MessageKey];

/** Extra arguments for `plural(base, count, ...)`: the placeholders other than `{count}`. */
type PluralArgs<B extends PluralKey> = Params<Exclude<Placeholders<Messages[`${B}.other`]>, "count">>;

export type Translate = <K extends MessageKey>(key: K, ...args: TranslateArgs<K>) => string;
export type TranslatePlural = <B extends PluralKey>(base: B, count: number, ...args: PluralArgs<B>) => string;

export function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
}

/** Looks a key up in a catalog, falling back to English when the catalog leaves it out. */
function lookup(catalog: Catalog, key: MessageKey): string {
  return catalog[key] ?? english[key] ?? key;
}

export function createTranslator(catalog: Catalog, language: string): { t: Translate; plural: TranslatePlural } {
  const rules = new Intl.PluralRules(language);
  const t: Translate = (key, ...args) => format(lookup(catalog, key), args[0]);
  const plural: TranslatePlural = (base, count, ...args) => {
    // Catalogs only define "one" and "other"; categories like "few" or "many" use "other".
    const key = rules.select(count) === "one" ? (`${base}.one` as MessageKey) : (`${base}.other` as MessageKey);
    return format(lookup(catalog, key), { ...args[0], count: count.toLocaleString(language) });
  };
  return { t, plural };
}
