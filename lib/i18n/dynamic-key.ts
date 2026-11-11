import { hasEnglish, type PlainMessageKey, type Translate } from "@/lib/i18n/translate";

/** A key-safe form of a name from a data table: "Company page cover" becomes "company-page-cover". */
export function keySlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Translates a name from a data table (a template, a category) by a key built from its stable id or name.
 * A name with no message keeps its English text, so a new item shows up before it is translated.
 */
export function translateName(t: Translate, key: string, fallback: string): string {
  return hasEnglish(key) ? t(key as PlainMessageKey) : fallback;
}
