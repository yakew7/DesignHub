import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  defaultName,
  newFiles,
  patchArea,
  patchCatalogs,
  patchInProgress,
  patchLocales,
  validCode,
} from "../../scripts/new-language.mjs";

const read = (path: string) => readFileSync(path, "utf8");
const areas = ["brand", "colors", "icons", "logo", "mockups", "projects", "social", "svg"];

describe("new-language", () => {
  test("accepts two lowercase letters that can name a constant", () => {
    expect(validCode("de")).toBe(true);
    expect(validCode("pt")).toBe(true);
    for (const bad of ["", "d", "deu", "DE", "De", "d1", "d-", "pt-br", "in", "if", "do"]) {
      expect(validCode(bad), bad).toBe(false);
    }
  });

  test("names the language in its own name, or by its code when the runtime does not know it", () => {
    expect(defaultName("de")).toBe("Deutsch");
    expect(defaultName("es")).toBe("Español");
    expect(defaultName("zz")).toBe("zz");
  });

  test("writes the core and one empty part for each area", () => {
    const files = newFiles("de", areas);
    expect(Object.keys(files).sort()).toEqual([
      "lib/i18n/messages/de-brand.ts",
      "lib/i18n/messages/de-colors.ts",
      "lib/i18n/messages/de-icons.ts",
      "lib/i18n/messages/de-logo.ts",
      "lib/i18n/messages/de-mockups.ts",
      "lib/i18n/messages/de-projects.ts",
      "lib/i18n/messages/de-social.ts",
      "lib/i18n/messages/de-svg.ts",
      "lib/i18n/messages/de.ts",
    ]);
    expect(files["lib/i18n/messages/de.ts"]).toContain("export const de = {} satisfies Catalog;");
    expect(files["lib/i18n/messages/de-colors.ts"]).toContain("export const deColors = {} satisfies Catalog;");
    expect(files["lib/i18n/messages/de-svg.ts"]).toContain('import type { Catalog } from "@/lib/i18n/translate";');
  });

  test("registers the language in locales.ts: the list, the loader and its own name", () => {
    const next = patchLocales(read("lib/i18n/locales.ts"), "xx", "Xxish");
    expect(next).toMatch(/export const locales = \[[^\]]*"hi"[^\]]*, "xx"\] as const;/);
    expect(next).toContain('xx: () => import("@/lib/i18n/messages/xx").then((module) => module.xx),');
    expect(next).toMatch(/localeNames: Record<Locale, string> = \{[^}]*hi: "[^"]+",[^}]*\n  xx: "Xxish",\s*\};/);
    // The languages that were there are untouched.
    expect(next).toContain('es: () => import("@/lib/i18n/messages/es")');
    expect(next).toContain('es: "Español"');
  });

  test("joins the language's parts in all-catalogs.ts", () => {
    const next = patchCatalogs(read("lib/i18n/all-catalogs.ts"), "xx", areas);
    expect(next).toContain('import { xx } from "@/lib/i18n/messages/xx";');
    for (const area of areas) {
      const Area = area.charAt(0).toUpperCase() + area.slice(1);
      expect(next).toContain(`import { xx${Area} } from "@/lib/i18n/messages/xx-${area}";`);
    }
    expect(next).toMatch(/\n {2}xx: \{ \.\.\.xx, \.\.\.xxBrand, [^}]*\.\.\.xxSvg \},\n\};\s*$/);
    expect(next).toContain("  en,\n");
  });

  test("adds the language to an area's loaders, after the others", () => {
    const next = patchArea(read("lib/i18n/areas/brand.ts"), "xx", "brand");
    expect(next).toContain('xx: () => import("@/lib/i18n/messages/xx-brand").then((module) => module.xxBrand),\n});');
    expect(next.indexOf("hi:")).toBeLessThan(next.indexOf("xx:"));
  });

  test("lists the language as in progress, keeping the others", () => {
    const source = read("lib/i18n/complete-areas.ts");
    const once = patchInProgress(source, "xx");
    expect(once).toMatch(/languagesInProgress: readonly Locale\[\] = \[[^\]]*"xx"\];/);
    expect(patchInProgress(once, "yy")).toMatch(/\["xx", "yy"\];|, "xx", "yy"\];/);
  });

  test("every area file in the repository can take a new language", () => {
    for (const area of areas) expect(() => patchArea(read(`lib/i18n/areas/${area}.ts`), "xx", area)).not.toThrow();
  });
});
