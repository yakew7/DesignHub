import { describe, expect, test } from "vitest";

import { builtPatterns, catalogKeys, unusedKeys } from "../../scripts/check-messages.mjs";

describe("unused message check", () => {
  test("reads the keys of a catalog", () => {
    expect(catalogKeys('export const en = {\n  "a.b": "x",\n  "a.c.one": "y {count}",\n} as const;')).toEqual([
      "a.b",
      "a.c.one",
    ]);
  });

  test("a key named in the source, or the base of a plural, is used", () => {
    const source = 't("a.b"); plural("a.c", 2);';
    expect(unusedKeys(["a.b", "a.c.one", "a.c.other", "a.d"], source, [])).toEqual(["a.d"]);
  });

  test("a key built from a template or a prefix is used", () => {
    const source = 't(`studio.${id}.short`); const key = "mockups.template." + id;';
    const patterns = builtPatterns(source);
    expect(
      unusedKeys(["studio.logo.short", "studio.logo.title", "mockups.template.cap", "other.key"], source, patterns),
    ).toEqual(["studio.logo.title", "other.key"]);
  });
});
