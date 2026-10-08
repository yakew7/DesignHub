import { en } from "@/lib/i18n/messages/en";
import type { PlainMessageKey, Translate } from "@/lib/i18n/translate";

/**
 * An error whose message is a catalog key, so the UI can show it in the viewer's language.
 * `message` stays English, for logs and tests.
 */
export class LocalizedError extends Error {
  readonly key: PlainMessageKey;

  constructor(key: PlainMessageKey) {
    super(en[key]);
    this.name = "LocalizedError";
    this.key = key;
  }
}

/** The error's text in the current language, or `fallback` for errors that aren't localized. */
export function errorMessage(error: unknown, t: Translate, fallback: PlainMessageKey): string {
  return error instanceof LocalizedError ? t(error.key) : t(fallback);
}
