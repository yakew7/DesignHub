import { describe, expect, it } from "vitest";

import { LocalizedError } from "@/lib/i18n/errors";
import { catalogs, locales, resolveLocale } from "@/lib/i18n/locales";
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

  it("picks plural forms by count", () => {
    const { plural } = createTranslator(catalogs.es, "es");
    expect(plural("projects.toast.exported", 1)).toBe("Se exportó 1 proyecto");
    expect(plural("projects.toast.exported", 3)).toBe("Se exportaron 3 proyectos");
    const english = createTranslator(catalogs.en, "en");
    expect(english.plural("projects.toast.imported", 0)).toBe("Imported 0 projects");
    expect(english.plural("share.import.summary", 1, { heading: "Inter", body: "Lora" })).toBe(
      "Inter and Lora, 1 color.",
    );
  });

  it("keeps localized errors readable in English", () => {
    const error = new LocalizedError("error.file.json");
    expect(error.message).toBe("That file isn't valid JSON.");
    expect(createTranslator(catalogs.es, "es").t(error.key)).toBe("Ese archivo no es un JSON válido.");
  });
});

describe("resolveLocale", () => {
  it("uses the first browser language with a translation", () => {
    expect(resolveLocale(["es-MX", "en"])).toBe("es");
    expect(resolveLocale(["fr-FR", "ES"])).toBe("es");
    expect(resolveLocale(["en-GB", "es"])).toBe("en");
  });

  it("defaults to English", () => {
    expect(resolveLocale(["fr", "de-DE"])).toBe("en");
    expect(resolveLocale([])).toBe("en");
  });
});
