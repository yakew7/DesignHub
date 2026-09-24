import { encodeIco } from "@/lib/icons/ico";
import { svgToPngBytes } from "@/lib/icons/raster";
import { buildIconSvg } from "@/lib/icons/svg";
import { createZip, type ZipEntry } from "@/lib/zip";
import type { IconData, IconStyle } from "@/types/icons";

export const ICO_SIZES = [16, 32, 48];
export const PNG_TARGETS = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
] as const;

export type FaviconOptions = {
  appName: string;
  themeColor: string;
  backgroundColor: string;
};

export function faviconHtml(options: FaviconOptions): string {
  return `<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${options.themeColor}">`;
}

export function webManifest(options: FaviconOptions): string {
  return `${JSON.stringify(
    {
      name: options.appName,
      short_name: options.appName,
      icons: [
        { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
        { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
      ],
      theme_color: options.themeColor,
      background_color: options.backgroundColor,
      display: "standalone",
    },
    null,
    2,
  )}\n`;
}

/** Icon style used for favicons: fixed pixel size and never `currentColor` (browsers render it black). */
export function faviconStyle(style: IconStyle, fallbackColor: string): IconStyle {
  return { ...style, color: style.color === "currentColor" ? fallbackColor : style.color };
}

/** Draws the source at a pixel size. Icons re-render per size so stroke widths stay crisp; a fixed SVG just scales. */
export type FaviconSource = (size: number) => string;

async function encodeIcoFrom(render: FaviconSource): Promise<Uint8Array> {
  const images = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, png: await svgToPngBytes(render(size), size) })),
  );
  return encodeIco(images);
}

/** Every file of a favicon package for any SVG, so the Logo Studio can reuse the Icon Studio's pipeline. */
export async function faviconEntries(render: FaviconSource, svg: string, options: FaviconOptions): Promise<ZipEntry[]> {
  const pngs = await Promise.all(
    PNG_TARGETS.map(async (target) => ({
      name: target.name,
      data: await svgToPngBytes(render(target.size), target.size),
    })),
  );
  return [
    { name: "favicon.ico", data: await encodeIcoFrom(render) },
    { name: "icon.svg", data: svg },
    ...pngs,
    { name: "site.webmanifest", data: webManifest(options) },
    {
      name: "favicon.html",
      data: `${faviconHtml(options)}
`,
    },
  ];
}

export async function buildIco(icon: IconData, style: IconStyle): Promise<Uint8Array> {
  return encodeIcoFrom((size) => buildIconSvg(icon, { ...style, size }));
}

/** Everything a modern site needs, zipped. */
export async function buildFaviconPackage(
  icon: IconData,
  style: IconStyle,
  options: FaviconOptions,
): Promise<Uint8Array> {
  const svg = buildIconSvg(icon, { ...style, size: 512 }, { uniqueIds: true });
  return createZip(await faviconEntries((size) => buildIconSvg(icon, { ...style, size }), svg, options));
}

/** The same package for a ready-made SVG, such as the Logo Studio's app icon. */
export async function buildFaviconPackageFromSvg(svg: string, options: FaviconOptions): Promise<Uint8Array> {
  return createZip(await faviconEntries(() => svg, svg, options));
}
