import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import { colorExports, gimpPalette, paletteSvg, type NamedColor } from "@/lib/color/export";
import { defaultShadeOptions } from "@/lib/color/shades";

const palette: NamedColor[] = [
  { name: "indigo", color: fromHex("#6366f1"), shades: [{ step: 50, color: fromHex("#0a0b0c") }] },
  { name: "amber", color: fromHex("#f59e0b"), shades: [{ step: 50, color: fromHex("#fff7e6") }] },
];

describe("GIMP palette", () => {
  test("writes the header and one R G B<TAB>name line per color", () => {
    const gpl = gimpPalette(palette, false, "Acme Labs");
    expect(gpl.startsWith("GIMP Palette\nName: Acme Labs\n#\n")).toBe(true);
    expect(gpl).toContain(" 99 102 241\tindigo\n");
    expect(gpl).toContain("245 158  11\tamber\n");
    expect(gpl).not.toContain("indigo-50");
  });

  test("adds shades as their own named lines, one row per color", () => {
    const gpl = gimpPalette(palette, true, "Acme\nLabs");
    expect(gpl).toContain("Name: Acme Labs\nColumns: 2\n");
    expect(gpl).toContain(" 10  11  12\tindigo-50\n");
  });

  test("is listed in the color exports", () => {
    const formats = colorExports({
      colors: [fromHex("#6366f1")],
      gradient: {
        type: "linear",
        angle: 90,
        x: 50,
        y: 50,
        interpolation: "oklch",
        stops: [
          { id: "a", color: fromHex("#6366f1"), position: 0 },
          { id: "b", color: fromHex("#f59e0b"), position: 100 },
        ],
      },
      format: "hex",
      includeShades: false,
      shadeOptions: defaultShadeOptions,
    });
    const gpl = formats.find((format) => format.id === "gpl");
    expect(gpl?.filename).toBe("palette.gpl");
    expect(gpl?.code).toMatch(/^GIMP Palette\nName: DesignHub palette\n#\n 99 102 241\t\S+\n$/);
  });
});

describe("Palette SVG", () => {
  test("renders colors in order with their names and hex values", () => {
    const svg = paletteSvg(palette);

    expect(svg.indexOf("#6366f1")).toBeLessThan(svg.indexOf("#f59e0b"));

    expect(svg).toContain(">indigo</text>");
    expect(svg).toContain(">amber</text>");

    expect(svg).toContain(">#6366f1</text>");
    expect(svg).toContain(">#f59e0b</text>");
  });

  test("uses readable black or white text based on the background", () => {
    const svg = paletteSvg([
      {
        name: "black",
        color: fromHex("#000000"),
        shades: [],
      },
      {
        name: "white",
        color: fromHex("#ffffff"),
        shades: [],
      },
    ]);

    expect(svg).toContain('fill="#ffffff" text-anchor="middle"');
    expect(svg).toContain('fill="#000000" text-anchor="middle"');
  });
});
