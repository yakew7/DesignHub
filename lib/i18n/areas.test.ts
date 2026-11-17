import { describe, expect, test } from "vitest";

import { en } from "@/lib/i18n/messages/en";
import { enBrand } from "@/lib/i18n/messages/en-brand";
import { enColors } from "@/lib/i18n/messages/en-colors";
import { enCore } from "@/lib/i18n/messages/en-core";
import { enIcons } from "@/lib/i18n/messages/en-icons";
import { enLogo } from "@/lib/i18n/messages/en-logo";
import { enMockups } from "@/lib/i18n/messages/en-mockups";
import { enProjects } from "@/lib/i18n/messages/en-projects";
import { enSocial } from "@/lib/i18n/messages/en-social";
import { enSvg } from "@/lib/i18n/messages/en-svg";

const parts = { enBrand, enColors, enCore, enIcons, enLogo, enMockups, enProjects, enSocial, enSvg };

describe("the English catalog in parts", () => {
  test("no key is in two parts, and together they are the whole catalog", () => {
    const seen = new Map<string, string>();
    for (const [name, part] of Object.entries(parts)) {
      for (const key of Object.keys(part)) {
        expect(seen.get(key), `${key} is in ${seen.get(key)} and ${name}`).toBeUndefined();
        seen.set(key, name);
      }
    }
    expect([...seen.keys()].sort()).toEqual(Object.keys(en).sort());
  });

  test("each studio area holds only its own keys, and the core holds none of them", () => {
    const owners: [string, Record<string, string>][] = [
      ["brand.", enBrand],
      ["colors.", enColors],
      ["icons.", enIcons],
      ["logo.", enLogo],
      ["mockups.", enMockups],
      ["projects.", enProjects],
      ["social.", enSocial],
      ["svg.", enSvg],
    ];
    for (const [prefix, part] of owners) {
      for (const key of Object.keys(part)) expect(key.startsWith(prefix), key).toBe(true);
    }
    // svg.compare.* is used by the comparison canvas in several studios, so it stays in the core.
    const inCore = Object.keys(enCore).filter((key) =>
      /^(brand|colors|icons|logo|mockups|projects|social|svg)\./.test(key),
    );
    expect(inCore.every((key) => key.startsWith("svg.compare."))).toBe(true);
  });
});
