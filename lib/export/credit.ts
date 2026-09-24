import { siteConfig } from "@/lib/site";

/**
 * "Made with DesignHub" credit. It goes into file metadata (never onto the artwork) and into
 * the README snippets and ZIP notes, so assets carry a link back to the project.
 */
export const CREDIT_TEXT = `Made with DesignHub - ${siteConfig.github}`;

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** A PNG tEXt chunk (Latin-1 keyword, NUL, text). */
function textChunk(keyword: string, text: string): Uint8Array {
  const data = new TextEncoder().encode(`${keyword}\0${text}`);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set([0x74, 0x45, 0x58, 0x74], 4); // "tEXt"
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

/**
 * Adds Software, Source and Comment text chunks right after the IHDR chunk. Viewers and
 * tools like exiftool show them; the pixels are untouched. Non-PNG input is returned as is.
 */
export function withPngCredit(png: Uint8Array): Uint8Array {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.length < 33 || signature.some((byte, i) => png[i] !== byte)) return png;
  const ihdrEnd = 8 + 12 + new DataView(png.buffer, png.byteOffset).getUint32(8);
  const chunks = [
    textChunk("Software", "DesignHub"),
    textChunk("Source", siteConfig.github),
    textChunk("Comment", CREDIT_TEXT),
  ];
  const extra = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(png.length + extra);
  out.set(png.subarray(0, ihdrEnd), 0);
  let offset = ihdrEnd;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  out.set(png.subarray(ihdrEnd), offset);
  return out;
}

/** Adds the credit to an SVG as an XML comment and <metadata>, which don't render. */
export function withSvgCredit(svg: string): string {
  if (svg.includes(siteConfig.github)) return svg;
  const note = `<!-- ${CREDIT_TEXT} --><metadata>${CREDIT_TEXT}</metadata>`;
  return svg.replace(/<svg\b[^>]*>/, (open) => `${open}${note}`);
}
