import { describe, expect, test } from "vitest";

import { compareBrands, differenceSummary } from "@/lib/projects/compare";
import { snapshotTokens } from "@/lib/projects/preview";
import { defaultSnapshot } from "@/lib/projects/snapshot";

describe("compareBrands", () => {
  test("a brand compared with itself has no differences", () => {
    const tokens = snapshotTokens(defaultSnapshot("Acme"));
    const rows = compareBrands(tokens, tokens);
    expect(rows.map((row) => row.group)).toEqual([
      "Colors",
      "Colors",
      "Colors",
      "Fonts",
      "Fonts",
      "Radius",
      "Spacing",
      "Shadow",
    ]);
    expect(rows.every((row) => !row.changed)).toBe(true);
    expect(differenceSummary(rows)).toBe("No differences");
  });

  test("changed fonts, radius, spacing and shadow are flagged", () => {
    const a = defaultSnapshot("A");
    const b = defaultSnapshot("B");
    b.typography.headingFont = a.typography.headingFont === "Inter" ? "Lora" : "Inter";
    b.tokens.settings.radiusBase = a.tokens.settings.radiusBase + 4;
    b.tokens.settings.spacingBase = a.tokens.settings.spacingBase * 2;
    b.effects.settings.shadow.layers = [];
    const rows = compareBrands(snapshotTokens(a), snapshotTokens(b));
    const changed = rows.filter((row) => row.changed).map((row) => row.id);
    expect(changed).toEqual(["font-heading", "radius", "spacing", "shadow"]);
    expect(rows.find((row) => row.id === "radius")?.b.text).toBe(`${b.tokens.settings.radiusBase}px`);
    expect(rows.find((row) => row.id === "shadow")?.b.text).toBe("none");
    expect(differenceSummary(rows)).toBe("4 differences");
  });

  test("colors compare by role, ignoring hex case", () => {
    const tokens = snapshotTokens(defaultSnapshot("A"));
    const lower = {
      ...tokens,
      colors: { ...tokens.colors, primary: tokens.colors.primary.map((hex) => hex.toLowerCase()) },
    };
    expect(compareBrands(tokens, lower).some((row) => row.changed)).toBe(false);

    const recolored = { ...tokens, colors: { ...tokens.colors, secondary: ["#123456"] } };
    const rows = compareBrands(tokens, recolored);
    const secondary = rows.find((row) => row.id === "colors-secondary");
    expect(secondary?.changed).toBe(true);
    expect(secondary?.b).toEqual({ text: "#123456", colors: ["#123456"] });
    expect(differenceSummary(rows)).toBe("1 difference");
  });
});
