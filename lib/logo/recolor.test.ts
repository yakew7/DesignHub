import { describe, expect, test } from "vitest";

import { extractColors, monochromeSvg, recolorSvg } from "@/lib/logo/recolor";
import { xmlError } from "@/lib/test/xml";

const logo = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
  "<defs>",
  '<linearGradient id="g"><stop offset="0" stop-color="#F00"/><stop offset="1" style="stop-color: #00FF00"/></linearGradient>',
  "</defs>",
  '<rect width="100" height="100" fill="url(#g)"/>',
  '<circle cx="50" cy="50" r="20" fill="#ABC" stroke="NONE"/>',
  '<path d="M0 0L10 10" fill="none" stroke="RED"/>',
  '<path d="M5 5L20 20" style="FILL:#123456; stroke: rgb(0, 0, 255);opacity:0.5"/>',
  '<text x="10" y="90" fill="currentColor">Acme &amp; Co</text>',
  "</svg>",
].join("");

describe("extractColors", () => {
  test("finds fill, stroke and style colors in any case and short hex, in document order", () => {
    expect(extractColors(logo)).toEqual(["#ff0000", "#00ff00", "#aabbcc", "#123456", "#0000ff"]);
  });

  test("lists each color once", () => {
    const svg = '<svg><rect fill="#fff"/><rect fill="#FFFFFF"/><rect stroke="white"/></svg>';
    expect(extractColors(svg)).toEqual(["#ffffff"]);
  });

  test("skips none, transparent, currentColor, inherit and url() references", () => {
    const svg =
      '<svg><rect fill="none"/><rect fill="transparent"/><rect fill="currentColor"/><rect fill="inherit"/><rect fill="url(#a)"/></svg>';
    expect(extractColors(svg)).toEqual([]);
  });

  test("reads colors marked !important in a style attribute", () => {
    expect(extractColors('<svg><path style="fill: #F00 !important;stroke:blue"/></svg>')).toEqual([
      "#ff0000",
      "#0000ff",
    ]);
  });

  test("returns nothing for invalid markup", () => {
    expect(extractColors("<svg><rect></svg>")).toEqual([]);
    expect(extractColors("not svg")).toEqual([]);
  });
});

describe("recolorSvg", () => {
  test("replaces mapped colors wherever they appear and keeps the markup well formed", () => {
    const out = recolorSvg(logo, { "#ff0000": "#111111", "#123456": "#222222", "#0000ff": "#333333" });
    expect(xmlError(out)).toBeNull();
    expect(extractColors(out)).toEqual(["#111111", "#00ff00", "#aabbcc", "#222222", "#333333"]);
    // Unmapped colors, none, gradient references and other style declarations are untouched.
    expect(out).toContain('fill="#ABC"');
    expect(out).toContain('fill="none"');
    expect(out).toContain('stroke="NONE"');
    expect(out).toContain('fill="url(#g)"');
    expect(out).toContain("opacity:0.5");
    expect(out).toContain("Acme &amp; Co");
  });

  test("keeps the gradient's structure intact", () => {
    const out = recolorSvg(logo, { "#00ff00": "#444444" });
    expect(out).toMatch(/<linearGradient id="g"><stop offset="0" [^>]*\/><stop offset="1" [^>]*\/><\/linearGradient>/);
    expect(out).toContain("stop-color:#444444");
  });

  test("recolors !important declarations and keeps the flag", () => {
    const svg = '<svg><path style="fill: #F00 !important;stroke:blue"/></svg>';
    expect(recolorSvg(svg, { "#ff0000": "#000000" })).toBe(
      '<svg><path style="fill:#000000 !important;stroke:blue"/></svg>',
    );
    expect(monochromeSvg(svg, "#222222")).toContain('style="fill:#222222 !important;stroke:#222222"');
  });

  test("returns the input unchanged when it can't be parsed", () => {
    expect(recolorSvg("<svg>", { "#000000": "#ffffff" })).toBe("<svg>");
  });
});

describe("monochromeSvg", () => {
  test("paints every visible color one color and keeps none and gradient references", () => {
    const out = monochromeSvg(logo, "#000000");
    expect(xmlError(out)).toBeNull();
    expect(extractColors(out)).toEqual(["#000000"]);
    expect(out).toContain('fill="none"');
    expect(out).toContain('stroke="NONE"');
    expect(out).toContain('fill="url(#g)"');
    expect(out).toMatch(/<linearGradient id="g"><stop [^>]*\/><stop [^>]*\/><\/linearGradient>/);
    // currentColor inherits the text color, so it is painted too.
    expect(out).not.toContain("currentColor");
  });

  test("makes the default black fill explicit on the root", () => {
    const out = monochromeSvg('<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>', "#ff6600");
    expect(out).toContain('fill="#ff6600"');
    expect(xmlError(out)).toBeNull();
  });

  test("keeps an existing root fill", () => {
    const out = monochromeSvg('<svg fill="none"><path d="M0 0" stroke="#000"/></svg>', "#ff6600");
    expect(out).toMatch(/^<svg fill="none"/);
    expect(out).toContain('stroke="#ff6600"');
  });
});
