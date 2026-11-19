import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { newFiles, patchCatalogs, patchEn, patchTest, validName } from "../../scripts/new-area.mjs";

const read = (path: string) => readFileSync(path, "utf8");

describe("new-area", () => {
  test("accepts a lowercase name that can start a key prefix", () => {
    expect(validName("reports")).toBe(true);
    expect(validName("a2")).toBe(true);
    for (const bad of ["", "Reports", "2fa", "my-area", "a.b", "a b"]) expect(validName(bad)).toBe(false);
  });

  test("writes the four parts and the area module, with the names the other areas use", () => {
    const files = newFiles("reports");
    expect(Object.keys(files).sort()).toEqual([
      "lib/i18n/areas/reports.ts",
      "lib/i18n/messages/en-reports.ts",
      "lib/i18n/messages/es-reports.ts",
      "lib/i18n/messages/fr-reports.ts",
      "lib/i18n/messages/hi-reports.ts",
    ]);
    expect(files["lib/i18n/messages/en-reports.ts"]).toContain("export const enReports = {} as const;");
    expect(files["lib/i18n/messages/hi-reports.ts"]).toContain("export const hiReports = {} satisfies Catalog;");
    const area = files["lib/i18n/areas/reports.ts"] ?? "";
    expect(area).toContain('registerAreaLoaders("reports", {');
    expect(area).toContain('import("@/lib/i18n/messages/fr-reports").then((module) => module.frReports)');
  });

  test("joins the English part in en.ts, once, keeping the others", () => {
    const next = patchEn(read("lib/i18n/messages/en.ts"), "reports");
    expect(next).toContain('import { enReports } from "@/lib/i18n/messages/en-reports";');
    expect(next).toMatch(/\.\.\.enSvg,\s*\.\.\.enReports,?\s*\} as const;/);
    expect(next.match(/enReports/g)?.length).toBe(2);
  });

  test("joins each language's part in all-catalogs.ts", () => {
    const next = patchCatalogs(read("lib/i18n/all-catalogs.ts"), "reports");
    for (const code of ["es", "fr", "hi"]) {
      expect(next).toContain(`import { ${code}Reports } from "@/lib/i18n/messages/${code}-reports";`);
      expect(next).toMatch(new RegExp(`\\.\\.\\.${code}Svg,\\s*\\.\\.\\.${code}Reports`));
    }
  });

  test("adds the part to the parts test: the import, the parts and the owner of its prefix", () => {
    const next = patchTest(read("lib/i18n/areas.test.ts"), "reports");
    expect(next).toContain('import { enReports } from "@/lib/i18n/messages/en-reports";');
    expect(next).toMatch(/enSvg,\s*enReports,?\s*\};/);
    expect(next).toContain('["reports.", enReports]');
  });
});
