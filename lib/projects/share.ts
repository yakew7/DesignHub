import type { BrandSnapshot } from "@/lib/projects/snapshot";
import { parseProjectsFile, PROJECT_FORMAT } from "@/lib/projects/transfer";
import { crc32 } from "@/lib/zip";

/**
 * Share links carry a whole brand in the URL hash, so nothing is uploaded anywhere:
 * `#share=1.<crc32 of the JSON>.<deflate-raw JSON as base64url>`. The checksum catches
 * links that were edited or cut off; the JSON is then checked like an imported file.
 */

const KEY = "share=";
const VERSION = "1";
/** Links longer than this get unwieldy in chat apps and some browsers, so the logo is dropped. */
export const MAX_SHARE_LENGTH = 8000;
/** Upper bounds for a link and its inflated JSON, so a crafted link can't exhaust memory. */
const MAX_TOKEN_LENGTH = 200_000;
const MAX_JSON_BYTES = 2_000_000;

export type SharedBrand = { snapshot: BrandSnapshot; logoOmitted: boolean };

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream, limit = Infinity) {
  const reader = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(transform).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const checksum = (bytes: Uint8Array) => crc32(bytes).toString(16).padStart(8, "0");

async function encodeToken(snapshot: BrandSnapshot, logoOmitted: boolean): Promise<string> {
  const json = JSON.stringify({ format: PROJECT_FORMAT, version: 1, logoOmitted, snapshot });
  const bytes = new TextEncoder().encode(json);
  const packed = await pipe(bytes, new CompressionStream("deflate-raw"));
  return `${VERSION}.${checksum(bytes)}.${toBase64Url(packed)}`;
}

/**
 * A link that opens `base` and offers to import the brand. When the link would be longer
 * than MAX_SHARE_LENGTH, the uploaded logos are left out and `logoOmitted` says so.
 */
export async function createShareLink(
  snapshot: BrandSnapshot,
  base: string,
): Promise<{ url: string; logoOmitted: boolean }> {
  const link = async (data: BrandSnapshot, omitted: boolean) =>
    `${base.replace(/#.*$/, "")}#${KEY}${await encodeToken(data, omitted)}`;
  const full = await link(snapshot, false);
  const hasLogo = snapshot.brand.profile.logoSvg !== null || snapshot.social.design.logoSvg !== null;
  if (full.length <= MAX_SHARE_LENGTH || !hasLogo) return { url: full, logoOmitted: false };
  const lighter = structuredClone(snapshot);
  lighter.brand.profile.logoSvg = null;
  lighter.social.design.logoSvg = null;
  return { url: await link(lighter, true), logoOmitted: true };
}

/** The share token in a URL hash ("#share=..."), or null when the hash isn't a share link. */
export function shareToken(hash: string): string | null {
  const value = hash.replace(/^#/, "");
  return value.startsWith(KEY) ? value.slice(KEY.length) : null;
}

const damaged = "This share link is damaged or incomplete. Ask for a new one.";

/** Decodes and validates a share token. Throws a readable error for anything that isn't a brand. */
export async function readShareToken(token: string): Promise<SharedBrand> {
  const match = /^(\d+)\.([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(token.trim());
  if (!match || token.length > MAX_TOKEN_LENGTH) throw new Error(damaged);
  const [, version, sum, data] = match;
  if (version !== VERSION) throw new Error("This share link comes from a newer version of DesignHub.");
  let bytes: Uint8Array;
  try {
    bytes = await pipe(fromBase64Url(data!), new DecompressionStream("deflate-raw"), MAX_JSON_BYTES);
  } catch {
    throw new Error(damaged);
  }
  if (checksum(bytes) !== sum) throw new Error(damaged);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(damaged);
  }
  // Same checks as an imported project file, including re-sanitizing any logo.
  const entries = parseProjectsFile(text);
  const entry = entries[0];
  if (entries.length !== 1 || !entry) throw new Error("A share link holds exactly one brand.");
  const logoOmitted = (JSON.parse(text) as { logoOmitted?: unknown }).logoOmitted === true;
  return { snapshot: entry.snapshot, logoOmitted };
}
