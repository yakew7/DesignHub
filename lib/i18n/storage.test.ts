import { describe, expect, test } from "vitest";

import { resolveLocale } from "@/lib/i18n/locales";
import { detectableLanguages } from "@/lib/i18n/storage";

describe("detectableLanguages", () => {
  test("leaves out a language that is still in progress, with its regional forms", () => {
    expect(detectableLanguages(["de-AT", "de", "es-MX", "en"])).toEqual(["es-MX", "en"]);
  });

  test("a browser set to a language in progress is not switched to it, and falls to the next one it can", () => {
    expect(resolveLocale(detectableLanguages(["de-DE", "fr"]))).toBe("fr");
    expect(resolveLocale(detectableLanguages(["de-DE"]))).toBe("en");
  });
});
