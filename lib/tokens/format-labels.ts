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

/** The messages for the deprecation notes in `lib/tokens/tiers.ts`, whose English text is also what the CLI prints. */
const noteKeys: Readonly<Record<string, PlainMessageKey>> = {
  gtk: "code.note.gtk",
  stylus: "code.note.stylus",
};

const own = (table: Readonly<Record<string, PlainMessageKey>>, id: string): PlainMessageKey | undefined =>
  Object.hasOwn(table, id) ? table[id] : undefined;

/**
 * The formats with their labels and deprecation notes in the chosen language. Ids, file names and code are untouched.
 * A format whose label changed keeps its English label in `aliases`, so the format search finds it by either name.
 */
export function translateFormatLabels<T extends { id: string; label: string; deprecated?: string }>(
  t: Translate,
  formats: T[],
): (T & { aliases?: string[] })[] {
  return formats.map((format) => {
    const labelKey = own(formatLabelKeys, format.id);
    const noteKey = format.deprecated ? own(noteKeys, format.id) : undefined;
    if (!labelKey && !noteKey) return format;
    const label = labelKey ? t(labelKey) : format.label;
    return {
      ...format,
      label,
      ...(noteKey ? { deprecated: t(noteKey) } : {}),
      ...(label !== format.label ? { aliases: [format.label] } : {}),
    };
  });
}
