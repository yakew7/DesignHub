import { formatColor, toHex, toRgb } from "@/lib/color/color";
import { gradientCss, gradientCssFallback, sortedStops } from "@/lib/color/gradient";
import { paletteNames } from "@/lib/color/names";
import { generateShades, type ShadeOptions } from "@/lib/color/shades";
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
  ];
}
