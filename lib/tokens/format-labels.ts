import "@/lib/i18n/areas/colors";
import type { PlainMessageKey, Translate } from "@/lib/i18n/translate";

/**
 * The messages that name a token format. A format's `label` in `lib/tokens/formats/*.ts` is its English name and
 * stays as it is (it is data, and ids and file names do not depend on it); the studios that list formats show the
 * translated name when one exists. A format with no message here keeps its English label.
 */
const formatLabelKeys: Readonly<Record<string, PlainMessageKey>> = {
  css: "colors.export.format.css",
  json: "colors.export.format.json",
};

/** The formats with their labels in the chosen language. Ids, file names and code are untouched. */
export function translateFormatLabels<T extends { id: string; label: string }>(t: Translate, formats: T[]): T[] {
  return formats.map((format) => {
    const key = Object.hasOwn(formatLabelKeys, format.id) ? formatLabelKeys[format.id] : undefined;
    return key ? { ...format, label: t(key) } : format;
  });
}
