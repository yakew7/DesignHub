import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { base64DataUriLength, svgBackgroundCss, svgCssUrl, svgDataUri } from "@/lib/svg/data-uri";

const figma = readFileSync(join(__dirname, "__fixtures__/figma-export.svg"), "utf8");

describe("svgDataUri", () => {
  test("encodes #, <, > and swaps double quotes for single quotes", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#f00" d="M0 0h4"/></svg>';
    expect(svgDataUri(svg)).toBe(
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23f00' d='M0 0h4'/%3E%3C/svg%3E",
    );
  });

  test("encodes double quotes when the SVG already uses single quotes", () => {
    const svg = `<svg><text font-family="'Inter'">a</text></svg>`;
    const uri = svgDataUri(svg);
    expect(uri).toBe("data:image/svg+xml,%3Csvg%3E%3Ctext font-family=%22'Inter'%22%3Ea%3C/text%3E%3C/svg%3E");
    expect(uri).not.toContain('"');
  });

  test("encodes %, backslashes, newlines and non-ASCII so the URL survives a CSS string", () => {
    const uri = svgDataUri("<svg>\n<text>50% \\ café ✓</text></svg>");
    expect(uri).toContain("50%25 %5C caf%C3%A9 %E2%9C%93");
    expect(uri).toContain("%0A");
    expect(decodeURIComponent(uri.slice("data:image/svg+xml,".length))).toBe("<svg>\n<text>50% \\ café ✓</text></svg>");
  });

  test("decodes back to the same SVG (with single quotes) and is shorter than base64", () => {
    const uri = svgDataUri(figma);
    expect(decodeURIComponent(uri.slice("data:image/svg+xml,".length))).toBe(figma.trim().replace(/"/g, "'"));
    expect(uri.length).toBeLessThan(base64DataUriLength(figma));
    expect(base64DataUriLength(figma)).toBe(
      `data:image/svg+xml;base64,${Buffer.from(figma.trim()).toString("base64")}`.length,
    );
  });
});

test("svgBackgroundCss writes a background-image rule with a safe class name", () => {
  const css = svgBackgroundCss('<svg xmlns="http://www.w3.org/2000/svg"/>', "2024 Logo (final)");
  expect(css).toContain(".svg-2024-logo-final {");
  expect(css).toContain(`  background-image: ${svgCssUrl('<svg xmlns="http://www.w3.org/2000/svg"/>')};`);
  expect(css).toMatch(/^\/\* \d+ characters \(base64 would be \d+\) \*\//);
});
