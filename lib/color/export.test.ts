import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import { adobeSwatchExchange, colorExports, gimpPalette, paletteSvg, type NamedColor } from "@/lib/color/export";
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

describe("Adobe Swatch Exchange", () => {
  const utf16 = (text: string) => [...text].flatMap((char) => [0, char.charCodeAt(0)]);
  const float = (value: number) => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, value);
    return [...new Uint8Array(view.buffer)];
  };

  test("writes the ASEF header, version 1.0 and the block count", () => {
    const ase = adobeSwatchExchange(palette, false);
    expect([...ase.slice(0, 12)]).toEqual([0x41, 0x53, 0x45, 0x46, 0, 1, 0, 0, 0, 0, 0, 2]);
  });

  test("encodes a color as a named RGB float block", () => {
    const ase = adobeSwatchExchange(palette, false);
    const indigo = [
      ...[0x00, 0x01], // color entry
      ...[0, 0, 0, 34], // block length
      ...[0, 7], // "indigo" plus the terminator, in UTF-16 code units
      ...utf16("indigo"),
      ...[0, 0],
      ...[0x52, 0x47, 0x42, 0x20], // "RGB "
      ...float(99 / 255),
      ...float(102 / 255),
      ...float(241 / 255),
      ...[0, 2], // normal (process) color
    ];
    expect([...ase.slice(12, 12 + indigo.length)]).toEqual(indigo);
    // "amber" is one UTF-16 unit (two bytes) shorter than "indigo".
    expect(ase.length).toBe(12 + indigo.length + indigo.length - 2);
  });

  test("groups each color with its shades", () => {
    const ase = adobeSwatchExchange(palette, true);
    const view = new DataView(ase.buffer);
    // A group start, the base color, one shade and a group end for each color.
    expect(view.getUint32(8)).toBe(8);
    expect([...ase.slice(12, 22)]).toEqual([0xc0, 0x01, 0, 0, 0, 16, 0, 7, ...utf16("i")]);
    const groupEnd = [0xc0, 0x02, 0, 0, 0, 0];
    const ends = ase.reduce((count, _, i) => (groupEnd.every((byte, j) => ase[i + j] === byte) ? count + 1 : count), 0);
    expect(ends).toBe(2);
    expect([...ase.slice(-6)]).toEqual(groupEnd);
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
