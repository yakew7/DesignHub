import { describe, expect, test } from "vitest";

import { fr } from "@/lib/i18n/messages/fr";
import { createTranslator } from "@/lib/i18n/translate";
import { tokenFormatDefinitions } from "@/lib/tokens/formats";
import { translateFormatLabels } from "@/lib/tokens/format-labels";

const { t } = createTranslator(fr, "fr");

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
