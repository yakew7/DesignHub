import { describe, expect, test } from "vitest";

import { findMissingImports, importedAreas, neededAreas, withoutComments } from "../../scripts/check-areas.mjs";

const keys = { colors: new Set(["colors.tab.export", "colors.tab.share"]), logo: new Set(["logo.tabs.print"]) };

describe("the area import check", () => {
  test("a key, a template or a prefix of an area's keys needs the area; a filename or a comment does not", () => {
    expect([...neededAreas('t("colors.tab.export")', keys)]).toEqual(["colors"]);
    expect([...neededAreas("t(`colors.tab.${id}`)", keys)]).toEqual(["colors"]);
    expect([...neededAreas('const k = "logo.tabs." + id;', keys)]).toEqual(["logo"]);
    expect([...neededAreas('filename: "colors.xml"', keys)]).toEqual([]);
    expect([...neededAreas('// t("colors.tab.export")\n/* "logo.tabs.print" */', keys)]).toEqual([]);
  });

  test("comments are removed, but not a URL in a string", () => {
    expect(withoutComments('const a = "http://x.y"; // note')).toContain("http://x.y");
    expect(withoutComments("const a = 1; // note")).not.toContain("note");
  });

  test("finds a file that uses an area without importing it", () => {
    const files = new Map([
      ["components/colors/a.tsx", 't("colors.tab.export");'],
      ["components/colors/b.tsx", 'import "@/lib/i18n/areas/colors";\nt("colors.tab.export");'],
    ]);
    expect(findMissingImports(files, keys)).toEqual([{ file: "components/colors/a.tsx", area: "colors" }]);
  });

  test("an import in a file of the same folder that the file imports counts, one in another folder does not", () => {
    const files = new Map([
      ["components/colors/a.tsx", 'import { Panel } from "./panel";\nt("colors.tab.export");'],
      ["components/colors/panel.tsx", 'import "@/lib/i18n/areas/colors";\nexport const Panel = 1;'],
      ["components/other/c.tsx", 'import { Panel } from "@/components/colors/panel";\nt("colors.tab.export");'],
    ]);
    expect(findMissingImports(files, keys)).toEqual([{ file: "components/other/c.tsx", area: "colors" }]);
  });

  test("a file can opt out with a reason, and the imported areas are read", () => {
    const files = new Map([["lib/x.ts", '// check-areas: ignore the components import it\nt("logo.tabs.print");']]);
    expect(findMissingImports(files, keys)).toEqual([]);
    expect([...importedAreas('import "@/lib/i18n/areas/logo";\nimport "@/lib/i18n/areas/svg";')]).toEqual([
      "logo",
      "svg",
    ]);
  });
});
