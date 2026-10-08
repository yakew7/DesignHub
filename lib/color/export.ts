import { formatColor, readableTextColor, toHex, toRgb } from "@/lib/color/color";
import { gradientCss, gradientCssFallback, sortedStops } from "@/lib/color/gradient";
import { paletteNames } from "@/lib/color/names";
import { generateShades, type ShadeOptions } from "@/lib/color/shades";
import { createZip } from "@/lib/zip";
import type { ExportFormat } from "@/types/export";
import type { ColorFormat, Gradient, Oklch } from "@/types/color";

export type ColorExportInput = {
  colors: Oklch[];
  gradient: Gradient;
  format: ColorFormat;
  includeShades: boolean;
  shadeOptions: ShadeOptions;
  /** Palette name for formats that carry one (the GIMP palette). */
  name?: string;
};
function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
export type NamedColor = { name: string; color: Oklch; shades: { step: number; color: Oklch }[] };

export function namedPalette(colors: Oklch[], shadeOptions: ShadeOptions): NamedColor[] {
  const names = paletteNames(colors);
  return colors.map((color, index) => ({
    name: names[index] ?? `color-${index + 1}`,
    color,
    shades: generateShades(color, shadeOptions),
  }));
}

function variableLines(palette: NamedColor[], format: ColorFormat, includeShades: boolean, indent = "  "): string {
  return palette
    .map(({ name, color, shades }) => {
      const base = `${indent}--color-${name}: ${formatColor(color, format)};`;
      if (!includeShades) return base;
      const scale = shades.map(
        (shade) => `${indent}--color-${name}-${shade.step}: ${formatColor(shade.color, format)};`,
      );
      return [base, ...scale].join("\n");
    })
    .join("\n\n");
}

function css(input: ColorExportInput, palette: NamedColor[]): string {
  return `:root {
${variableLines(palette, input.format, input.includeShades)}

  --gradient-primary: ${gradientCssFallback(input.gradient)};
}

@supports (background: linear-gradient(in oklch, red, blue)) {
  :root {
    --gradient-primary: ${gradientCss(input.gradient)};
  }
}
`;
}

function tailwind(input: ColorExportInput, palette: NamedColor[]): string {
  return `/* Tailwind CSS v4 - use as bg-${palette[0]?.name ?? "brand"}-500, text-${palette[0]?.name ?? "brand"}, … */
@import "tailwindcss";

@theme {
${variableLines(palette, input.format, input.includeShades)}
}

@utility bg-gradient-primary {
  background: ${gradientCss(input.gradient)};
}
`;
}

/** DTCG color value (2025 draft): color space components plus a hex fallback. */
function tokenValue(color: Oklch) {
  return {
    colorSpace: "oklch",
    components: [Number(color.l.toFixed(4)), Number(color.c.toFixed(4)), Number(color.h.toFixed(2))],
    alpha: Number(color.alpha.toFixed(3)),
    hex: toHex({ ...color, alpha: 1 }),
  };
}

export function colorTokens(palette: NamedColor[], includeShades: boolean, gradient?: Gradient) {
  const color = Object.fromEntries(
    palette.map(({ name, color: base, shades }) => [
      name,
      includeShades
        ? {
            $type: "color",
            DEFAULT: { $value: tokenValue(base) },
            ...Object.fromEntries(shades.map((shade) => [String(shade.step), { $value: tokenValue(shade.color) }])),
          }
        : { $type: "color", $value: tokenValue(base) },
    ]),
  );
  return {
    color,
    ...(gradient
      ? {
          gradient: {
            primary: {
              $type: "gradient",
              $value: sortedStops(gradient).map((stop) => ({
                color: tokenValue(stop.color),
                position: Number((stop.position / 100).toFixed(3)),
              })),
              $extensions: { "dev.designhub.css": gradientCss(gradient) },
            },
          },
        }
      : {}),
  };
}

/**
 * GIMP palette (.gpl), which GIMP, Inkscape and Krita all read: a header, then one
 * "R G B<TAB>name" line per color. With shades, each color and its shades form one row.
 */
export function gimpPalette(palette: NamedColor[], includeShades: boolean, name = "DesignHub palette"): string {
  const line = (color: Oklch, label: string) => {
    const { r, g, b } = toRgb(color);
    return `${[r, g, b].map((channel) => String(channel).padStart(3)).join(" ")}\t${label}`;
  };
  const lines = palette.flatMap(({ name: colorName, color, shades }) => [
    line(color, colorName),
    ...(includeShades ? shades.map((shade) => line(shade.color, `${colorName}-${shade.step}`)) : []),
  ]);
  const columns = includeShades && palette[0] ? `Columns: ${palette[0].shades.length + 1}\n` : "";
  // The name is a single header line, so collapse any line breaks in it.
  const title = name.replace(/\s+/g, " ").trim() || "DesignHub palette";
  return `GIMP Palette\nName: ${title}\n${columns}#\n${lines.join("\n")}\n`;
}

const aseGroupStart = 0xc001;
const aseGroupEnd = 0xc002;
const aseColorEntry = 0x0001;
/** Swatch type 2 is a normal (process) color; 0 would be global and 1 spot. */
const aseNormal = 2;

type AseBlock = { type: number; name?: string; rgb?: [number, number, number] };

/**
 * Adobe Swatch Exchange (.ase), which Photoshop, Illustrator and InDesign import. The format is
 * big-endian: an "ASEF" signature, version 1.0 and a block count, then one block per color
 * (a UTF-16 name and three RGB floats from 0 to 1). With shades, each color and its shades
 * sit in a group named after the color.
 */
export function adobeSwatchExchange(palette: NamedColor[], includeShades: boolean): Uint8Array<ArrayBuffer> {
  const entry = (color: Oklch, name: string): AseBlock => {
    const { r, g, b } = toRgb(color);
    return { type: aseColorEntry, name, rgb: [r / 255, g / 255, b / 255] };
  };
  const blocks = palette.flatMap(({ name, color, shades }): AseBlock[] =>
    includeShades
      ? [
          { type: aseGroupStart, name },
          entry(color, name),
          ...shades.map((shade) => entry(shade.color, `${name}-${shade.step}`)),
          { type: aseGroupEnd },
        ]
      : [entry(color, name)],
  );

  // A name is its length in UTF-16 code units (counting the terminator), the units, then a 0.
  const nameBytes = (name: string | undefined) => (name === undefined ? 0 : 2 + (name.length + 1) * 2);
  const bodyLength = (block: AseBlock) => nameBytes(block.name) + (block.rgb ? 4 + 3 * 4 + 2 : 0);
  const size = 12 + blocks.reduce((total, block) => total + 6 + bodyLength(block), 0);

  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  let offset = 0;
  const ascii = (text: string) => [...text].forEach((char) => view.setUint8(offset++, char.charCodeAt(0)));
  const uint16 = (value: number) => {
    view.setUint16(offset, value);
    offset += 2;
  };
  const uint32 = (value: number) => {
    view.setUint32(offset, value);
    offset += 4;
  };

  ascii("ASEF");
  uint16(1);
  uint16(0);
  uint32(blocks.length);
  blocks.forEach((block) => {
    uint16(block.type);
    uint32(bodyLength(block));
    if (block.name !== undefined) {
      uint16(block.name.length + 1);
      for (let i = 0; i < block.name.length; i++) uint16(block.name.charCodeAt(i));
      uint16(0);
    }
    if (block.rgb) {
      ascii("RGB ");
      block.rgb.forEach((channel) => {
        view.setFloat32(offset, channel);
        offset += 4;
      });
      uint16(aseNormal);
    }
  });
  return new Uint8Array(buffer);
}

/** The palette as named colors, each followed by its shades when they're included. */
function paletteEntries(palette: NamedColor[], includeShades: boolean): { name: string; color: Oklch }[] {
  return palette.flatMap(({ name, color, shades }) => [
    { name, color },
    ...(includeShades ? shades.map((shade) => ({ name: `${name}-${shade.step}`, color: shade.color })) : []),
  ]);
}

const unit = (value: number) => Number(value.toFixed(6));

/**
 * Sketch palette (.sketchpalette), the JSON read by the Sketch Palettes plugin: format 2.0,
 * with each color as named red, green, blue and alpha floats from 0 to 1.
 */
export function sketchPalette(palette: NamedColor[], includeShades: boolean): string {
  const colors = paletteEntries(palette, includeShades).map(({ name, color }) => {
    const { r, g, b, alpha } = toRgb(color);
    return { name, red: unit(r / 255), green: unit(g / 255), blue: unit(b / 255), alpha: unit(alpha) };
  });
  return `${JSON.stringify({ compatibleVersion: "2.0", pluginVersion: "2.22", colors, gradients: [], images: [] }, null, 2)}\n`;
}

/** Procreate palettes hold 30 swatches (a 10 by 3 grid). */
export const procreateSwatchLimit = 30;

export type ProcreatePalette = {
  bytes: Uint8Array<ArrayBuffer>;
  /** Shades were asked for but didn't fit, so only the base colors are in the file. */
  shadesDropped: boolean;
  /** Base colors past the swatch limit that were left out. */
  colorsDropped: number;
};

/** sRGB channels from 0 to 255 as hue, saturation and brightness from 0 to 1. */
function hsb(r: number, g: number, b: number): { hue: number; saturation: number; brightness: number } {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta + 6) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return { hue: unit(hue / 6), saturation: max === 0 ? 0 : unit(delta / max), brightness: unit(max / 255) };
}

/**
 * Procreate swatches (.swatches): a ZIP holding Swatches.json, a one-palette array with a name
 * and up to 30 HSB swatches. Shades go in when the whole palette fits; otherwise the file falls
 * back to the base colors (and the first 30 of those), which the result reports.
 */
export function procreateSwatches(
  palette: NamedColor[],
  includeShades: boolean,
  name = "DesignHub palette",
): ProcreatePalette {
  const withShades = paletteEntries(palette, includeShades);
  const fits = withShades.length <= procreateSwatchLimit;
  const entries = fits ? withShades : paletteEntries(palette, false);
  const swatches = entries.slice(0, procreateSwatchLimit).map(({ color }) => {
    const { r, g, b, alpha } = toRgb(color);
    return { ...hsb(r, g, b), alpha: unit(alpha), colorSpace: 0 };
  });
  const title = name.replace(/\s+/g, " ").trim() || "DesignHub palette";
  return {
    bytes: createZip([{ name: "Swatches.json", data: JSON.stringify([{ name: title, swatches }]) }]),
    shadesDropped: includeShades && !fits,
    colorsDropped: Math.max(0, entries.length - procreateSwatchLimit),
  };
}

/** SVG has no conic gradients; conic falls back to a linear gradient at the same angle. */
export function gradientSvg(gradient: Gradient, width = 1200, height = 630): string {
  const stops = sortedStops(gradient)
    .map((stop) => {
      const opacity = stop.color.alpha < 1 ? ` stop-opacity="${stop.color.alpha}"` : "";
      return `    <stop offset="${Math.round(stop.position)}%" stop-color="${toHex({ ...stop.color, alpha: 1 })}"${opacity}/>`;
    })
    .join("\n");

  const definition =
    gradient.type === "radial"
      ? `  <radialGradient id="g" cx="${gradient.x}%" cy="${gradient.y}%" r="75%">
${stops}
  </radialGradient>`
      : // CSS 0deg points up; SVG's default vector points right (CSS 90deg).
        `  <linearGradient id="g" gradientTransform="rotate(${gradient.angle - 90} 0.5 0.5)">
${stops}
  </linearGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
${definition}
</defs>
<rect width="100%" height="100%" fill="url(#g)"/>
</svg>
`;
}

export function colorExports(input: ColorExportInput): ExportFormat[] {
  const palette = namedPalette(input.colors, input.shadeOptions);
  return [
    { id: "css", label: "CSS variables", filename: "colors.css", language: "css", code: css(input, palette) },
    { id: "tailwind", label: "Tailwind", filename: "tailwind.css", language: "css", code: tailwind(input, palette) },
    {
      id: "json",
      label: "JSON tokens",
      filename: "colors.tokens.json",
      language: "json",
      code: `${JSON.stringify(colorTokens(palette, input.includeShades, input.gradient), null, 2)}\n`,
    },
    { id: "svg", label: "SVG gradient", filename: "gradient.svg", language: "svg", code: gradientSvg(input.gradient) },
    {
      id: "gpl",
      label: "GIMP palette",
      filename: "palette.gpl",
      language: "text",
      code: gimpPalette(palette, input.includeShades, input.name),
    },
    {
      id: "sketch",
      label: "Sketch palette",
      filename: "palette.sketchpalette",
      language: "json",
      code: sketchPalette(palette, input.includeShades),
    },
  ];
}
export function paletteSvg(palette: NamedColor[], columnWidth = 240, height = 240): string {
  const width = Math.max(columnWidth, palette.length * columnWidth);

  const columns = palette
    .map(({ name, color }, index) => {
      const x = index * columnWidth;
      const background = toHex(color);
      const text = toHex(readableTextColor(color));

      return `  <g>
    <rect x="${x}" y="0" width="${columnWidth}" height="${height}" fill="${background}"/>
    <text x="${x + columnWidth / 2}" y="${height / 2 - 8}" fill="${text}" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600">${escapeXml(name)}</text>
    <text x="${x + columnWidth / 2}" y="${height / 2 + 24}" fill="${text}" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-size="16">${escapeXml(background)}</text>
  </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${columns}
</svg>
`;
}
