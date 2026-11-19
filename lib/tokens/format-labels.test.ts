import { describe, expect, test } from "vitest";

import { catalogs } from "@/lib/i18n/all-catalogs";
import { createTranslator } from "@/lib/i18n/translate";
import { tokenFormatDefinitions } from "@/lib/tokens/formats";
import { translateFormatLabels } from "@/lib/tokens/format-labels";
import { deprecatedIds, deprecationOf, exportTiers } from "@/lib/tokens/tiers";

const { t } = createTranslator(catalogs.fr, "fr");

describe("translateFormatLabels", () => {
  test("translates the label of a format that has a message and keeps everything else", () => {
    const formats = tokenFormatDefinitions.map(({ id, label, filename }) => ({ id, label, filename }));
    const translated = translateFormatLabels(t, formats);
    expect(translated.map(({ id, filename }) => ({ id, filename }))).toEqual(
      formats.map(({ id, filename }) => ({ id, filename })),
    );
    expect(translated.find((format) => format.id === "css")?.label).toBe("Variables CSS");
    expect(translated.find((format) => format.id === "json")?.label).toBe("Tokens JSON");
  });

  test("keeps the English label of a format with no message", () => {
    const [scss] = translateFormatLabels(t, [{ id: "scss", label: "SCSS" }]);
    expect(scss?.label).toBe("SCSS");
  });
});

describe("tier names and deprecation notes", () => {
  const languages = ["es", "fr", "hi"] as const;

  test("every deprecated format has a note message in every language, different from the English one", () => {
    for (const language of languages) {
      const { t: translate } = createTranslator(catalogs[language], language);
      const formats = deprecatedIds.map((id) => ({ id, label: id, deprecated: deprecationOf(id) }));
      for (const format of translateFormatLabels(translate, formats)) {
        expect(format.deprecated, `${language} ${format.id}`).toBeTruthy();
        expect(format.deprecated, `${language} ${format.id}`).not.toBe(deprecationOf(format.id));
      }
    }
  });

  test("keeps the English note for English, and a format without a note has none", () => {
    const { t: english } = createTranslator(catalogs.en, "en");
    const [gtk, css] = translateFormatLabels(english, [
      { id: "gtk", label: "GTK 4 CSS", deprecated: deprecationOf("gtk") },
      { id: "css", label: "CSS variables" },
    ]);
    expect(gtk?.deprecated).toBe(deprecationOf("gtk"));
    expect(css?.deprecated).toBeUndefined();
  });

  test("keeps the English label as an alias for the search when the label is translated", () => {
    const [css, scss] = translateFormatLabels(t, [
      { id: "css", label: "CSS variables" },
      { id: "scss", label: "SCSS" },
    ]);
    expect(css?.aliases).toEqual(["CSS variables"]);
    expect(scss?.aliases).toBeUndefined();
  });

  test("has a tier name in every language", () => {
    for (const language of languages) {
      const { t: translate } = createTranslator(catalogs[language], language);
      for (const tier of exportTiers)
        expect(translate(`code.tier.${tier}`), `${language} ${tier}`).not.toMatch(/^code\./);
    }
  });
});
