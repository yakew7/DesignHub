import {
  englishText,
  format,
  type MessageKey,
  type PlainMessageKey,
  type Translate,
  type TranslateArgs,
} from "@/lib/i18n/translate";

export type MessageParams = Record<string, string | number>;

/** A message key with its placeholder values: text that can be shown in any language later. */
export type Localized = { key: MessageKey; params?: MessageParams };

/** Builds a `Localized`, checking the key and its placeholders. */
export function localized<K extends MessageKey>(key: K, ...args: TranslateArgs<K>): Localized {
  return { key, params: args[0] };
}

/** Shows a `Localized` in the language of `t`. */
export function translateLocalized(t: Translate, text: Localized): string {
  const translate = t as (key: MessageKey, params?: MessageParams) => string;
  return translate(text.key, text.params);
}

/**
 * An error whose message is a catalog key, so the UI can show it in the viewer's language.
 * `message` stays English, for logs and tests.
 */
export class LocalizedError extends Error {
  readonly key: MessageKey;
  readonly params: MessageParams | undefined;

  constructor(text: Localized);
  constructor(key: PlainMessageKey);
  constructor(key: MessageKey, params: MessageParams);
  constructor(first: Localized | MessageKey, params?: MessageParams) {
    const text: Localized = typeof first === "string" ? { key: first, params } : first;
    super(format(englishText(text.key), text.params));
    this.name = "LocalizedError";
    this.key = text.key;
    this.params = text.params;
  }
}

/** The error's text in the current language, or `fallback` for errors that aren't localized. */
export function errorMessage(error: unknown, t: Translate, fallback: PlainMessageKey): string {
  return error instanceof LocalizedError ? translateLocalized(t, error) : t(fallback);
}
