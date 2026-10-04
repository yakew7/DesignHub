import { describe, expect, test } from "vitest";

import { createShareLink, MAX_SHARE_LENGTH, readShareToken, shareToken } from "@/lib/projects/share";
import { defaultSnapshot } from "@/lib/projects/snapshot";

const base = "https://designhub.example/brand";

async function token(snapshot = defaultSnapshot("Acme")) {
  const { url, logoOmitted } = await createShareLink(snapshot, base);
  return { url, logoOmitted, token: shareToken(new URL(url).hash)! };
}

/** A logo big enough to push the link past the limit. */
function bigLogo(): string {
  const dots = Array.from(
    { length: 1500 },
    (_, i) =>
      `<circle cx="${(i * 37) % 997}" cy="${(i * 53) % 991}" r="${(i % 9) + 1}" fill="#${((i * 2654435761) >>> 8).toString(16).padStart(6, "0").slice(0, 6)}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${dots}</svg>`;
}

describe("share links", () => {
  test("round-trips colors, fonts and tokens", async () => {
    const original = defaultSnapshot("Acme Labs");
    original.typography.headingFont = "Fraunces";
    original.tokens.settings.radiusBase = 14;
    const { url, logoOmitted, token: value } = await token(original);
    expect(url.startsWith(`${base}#share=1.`)).toBe(true);
    expect(url.length).toBeLessThan(MAX_SHARE_LENGTH);
    expect(logoOmitted).toBe(false);
    const shared = await readShareToken(value);
    expect(shared.logoOmitted).toBe(false);
    expect(shared.snapshot.brand.profile.name).toBe("Acme Labs");
    expect(shared.snapshot.colors.swatches).toEqual(original.colors.swatches);
    expect(shared.snapshot.typography).toEqual(original.typography);
    expect(shared.snapshot.tokens).toEqual(original.tokens);
    expect(shared.snapshot.effects).toEqual(original.effects);
  });

  test("keeps a small uploaded logo, sanitized on the way in", async () => {
    const snapshot = defaultSnapshot("Acme");
    snapshot.brand.profile.logoSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script><rect width="10" height="10"/></svg>';
    const shared = await readShareToken((await token(snapshot)).token);
    expect(shared.snapshot.brand.profile.logoSvg).toContain("<rect");
    expect(shared.snapshot.brand.profile.logoSvg).not.toMatch(/script|onload/);
  });

  test("leaves out a logo that would make the link too long, and says so", async () => {
    const snapshot = defaultSnapshot("Acme");
    snapshot.brand.profile.logoSvg = bigLogo();
    const { url, logoOmitted, token: value } = await token(snapshot);
    expect(logoOmitted).toBe(true);
    expect(url.length).toBeLessThanOrEqual(MAX_SHARE_LENGTH);
    const shared = await readShareToken(value);
    expect(shared.logoOmitted).toBe(true);
    expect(shared.snapshot.brand.profile.logoSvg).toBeNull();
  });

  test("reads only share hashes", () => {
    expect(shareToken("#share=1.abc")).toBe("1.abc");
    expect(shareToken("share=1.abc")).toBe("1.abc");
    expect(shareToken("#main")).toBeNull();
    expect(shareToken("")).toBeNull();
  });

  test("rejects a tampered link", async () => {
    const { token: value } = await token();
    const [version, sum, data] = value.split(".");
    // Flip one character in the middle of the compressed data.
    const i = Math.floor(data!.length / 2);
    const flipped = `${data!.slice(0, i)}${data![i] === "A" ? "B" : "A"}${data!.slice(i + 1)}`;
    await expect(readShareToken(`${version}.${sum}.${flipped}`)).rejects.toThrow(/damaged/);
    await expect(readShareToken(`${version}.${sum}.${data!.slice(0, -20)}`)).rejects.toThrow(/damaged/);
    await expect(readShareToken(`${version}.00000000.${data}`)).rejects.toThrow(/damaged/);
    await expect(readShareToken("not a link")).rejects.toThrow(/damaged/);
    await expect(readShareToken(`9.${sum}.${data}`)).rejects.toThrow(/newer version/);
  });

  test("rejects a well-formed link that doesn't hold a valid brand", async () => {
    const { crc32 } = await import("@/lib/zip");
    const json = new TextEncoder().encode(JSON.stringify({ format: "designhub.project", snapshot: { brand: {} } }));
    const packed = new Uint8Array(
      await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer(),
    );
    const data = Buffer.from(packed).toString("base64url");
    const sum = crc32(json).toString(16).padStart(8, "0");
    await expect(readShareToken(`1.${sum}.${data}`)).rejects.toThrow(/brand name is missing/);
  });
});
