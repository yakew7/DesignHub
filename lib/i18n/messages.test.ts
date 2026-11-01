import { describe, expect, it } from "vitest";

import { completeAreas } from "@/lib/i18n/complete-areas";
import { LocalizedError, translateLocalized } from "@/lib/i18n/errors";
import { catalogs } from "@/lib/i18n/all-catalogs";
import { locales, resolveLocale } from "@/lib/i18n/locales";
import { en } from "@/lib/i18n/messages/en";
import { createTranslator, format } from "@/lib/i18n/translate";

const EM_DASH = String.fromCharCode(0x2014);
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("message catalogs", () => {
  for (const locale of locales) {
    const catalog: Record<string, string | undefined> = catalogs[locale];

    it(`${locale}: every key exists in English`, () => {
      const extra = Object.keys(catalog).filter((key) => !Object.hasOwn(en, key));
      expect(extra).toEqual([]);
    });

    it(`${locale}: no message contains an em dash`, () => {
      const hits = Object.entries(catalog).filter(([, text]) => text?.includes(EM_DASH));
      expect(hits).toEqual([]);
    });

    it(`${locale}: uses the same placeholders as English`, () => {
      for (const [key, text] of Object.entries(catalog)) {
        expect(placeholders(text ?? ""), key).toEqual(placeholders(en[key as keyof typeof en]));
      }
    });
  }

  it("has a Hindi and a French translation for every Spanish key", () => {
    for (const locale of ["hi", "fr"] as const) {
      const missing = Object.keys(catalogs.es).filter((key) => !Object.hasOwn(catalogs[locale], key));
      expect(missing, locale).toEqual([]);
    }
  });

  it("translates every complete area in every language", () => {
    const keys = Object.keys(en).filter((key) => completeAreas.some((area) => key.startsWith(area)));
    for (const locale of ["es", "fr", "hi"] as const) {
      const missing = keys.filter((key) => !Object.hasOwn(catalogs[locale], key));
      expect(missing, `${locale} is missing keys in a complete area`).toEqual([]);
    }
  });

  it("lists only areas that exist in English", () => {
    const unused = completeAreas.filter((area) => !Object.keys(en).some((key) => key.startsWith(area)));
    expect(unused).toEqual([]);
  });
});

describe("translate", () => {
  it("fills placeholders and leaves unknown ones alone", () => {
    expect(format("Open {name}", { name: "Acme" })).toBe("Open Acme");
    expect(format("Open {name}", {})).toBe("Open {name}");
  });

  it("falls back to English for missing keys", () => {
    const { t } = createTranslator({ "nav.home": "Inicio" }, "es");
    expect(t("nav.home")).toBe("Inicio");
    expect(t("nav.roadmap")).toBe("Roadmap");
    expect(t("projects.card.openNamed", { name: "Acme" })).toBe("Open Acme");
  });

  it("translates the font result count in every locale", () => {
    const cases = [
      [catalogs.en, "en", "1 font", "2 fonts"],
      [catalogs.es, "es", "1 fuente", "2 fuentes"],
      [catalogs.fr, "fr", "1 police", "2 polices"],
      [catalogs.hi, "hi", "1 फ़ॉन्ट", "2 फ़ॉन्ट"],
    ] as const;

    for (const [catalog, locale, one, other] of cases) {
      const { plural } = createTranslator(catalog, locale);
      expect(plural("typography.fonts.count", 1)).toBe(one);
      expect(plural("typography.fonts.count", 2)).toBe(other);
    }
  });

  it("picks plural forms by count", () => {
    const { plural } = createTranslator(catalogs.es, "es");
    expect(plural("projects.toast.exported", 1)).toBe("Se exportó 1 proyecto");
    expect(plural("projects.toast.exported", 3)).toBe("Se exportaron 3 proyectos");
    // Hindi treats 0 and 1 as "one".
    const hindi = createTranslator(catalogs.hi, "hi");
    expect(hindi.plural("projects.toast.exported", 1)).toBe("1 प्रोजेक्ट एक्सपोर्ट किया गया");
    expect(hindi.plural("projects.toast.exported", 3)).toBe("3 प्रोजेक्ट एक्सपोर्ट किए गए");
    const english = createTranslator(catalogs.en, "en");
    expect(english.plural("projects.toast.imported", 0)).toBe("Imported 0 projects");
    expect(english.plural("share.import.summary", 1, { heading: "Inter", body: "Lora" })).toBe(
      "Inter and Lora, 1 color.",
    );
  });

  it("keeps localized errors readable in English", () => {
    const error = new LocalizedError("error.file.json");
    expect(error.message).toBe("That file isn't valid JSON.");
    expect(translateLocalized(createTranslator(catalogs.es, "es").t, error)).toBe("Ese archivo no es un JSON válido.");
  });
});

describe("resolveLocale", () => {
  it("uses the first browser language with a translation", () => {
    expect(resolveLocale(["es-MX", "en"])).toBe("es");
    expect(resolveLocale(["fr-FR", "ES"])).toBe("fr");
    expect(resolveLocale(["de-DE", "ES"])).toBe("es");
    expect(resolveLocale(["en-GB", "es"])).toBe("en");
    expect(resolveLocale(["hi-IN", "en"])).toBe("hi");
    expect(resolveLocale(["de", "HI"])).toBe("hi");
  });

  it("defaults to English", () => {
    expect(resolveLocale(["de", "ja-JP"])).toBe("en");
    expect(resolveLocale([])).toBe("en");
  });
});
