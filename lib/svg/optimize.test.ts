import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { reactComponent, toJsx } from "@/lib/svg/jsx";
import { defaultOptimizeOptions, optimizeSvg, optimizeTree } from "@/lib/svg/optimize";
import { parseSvg } from "@/lib/svg/parse";
import { reactNativeComponent } from "@/lib/svg/react-native";
import { minify } from "@/lib/svg/serialize";
import { buildSprite, symbolId } from "@/lib/svg/sprite";
import type { SvgNode } from "@/types/svg";

const fixture = (name: string) => readFileSync(join(__dirname, "__fixtures__", name), "utf8");

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const optimize = (source: string, patch: Partial<typeof defaultOptimizeOptions> = {}) =>
  optimizeSvg(tree(source), source, { ...defaultOptimizeOptions, ...patch }).svg;

describe("parseSvg", () => {
  test("accepts real exports with an XML prolog and doctype", () => {
    expect(parseSvg(fixture("figma-export.svg")).ok).toBe(true);
  });

  test("rejects non-SVG input", () => {
    expect(parseSvg("").ok).toBe(false);
    expect(parseSvg("<div></div>").ok).toBe(false);
    expect(parseSvg("not xml").ok).toBe(false);
  });
});

describe("optimizer", () => {
  const figma = fixture("figma-export.svg");

  test("removes metadata, descriptions and editor data", () => {
    const out = optimize(figma);
    expect(out).not.toMatch(/<metadata|<desc|sodipodi/);
  });

  test("always strips scripts and event handlers, even with every option off", () => {
    const allOff = Object.fromEntries(
      Object.entries(defaultOptimizeOptions).map(([key, value]) => [key, typeof value === "boolean" ? false : value]),
    );
    for (const out of [optimize(figma), optimize(figma, allOff)]) {
      expect(out).not.toMatch(/<script|onclick=|alert/);
    }
  });

  test("drops unused ids but keeps referenced ones", () => {
    const out = optimize(figma);
    expect(out).toContain('id="paint0"');
    expect(out).toContain("url(#paint0)");
    expect(out).not.toContain("unused-clip");
  });

  test("keeps an inherited presentation attribute that differs from its parent", () => {
    const out = optimize(figma);
    // The path overrides the group's stroke-width of 4, so both values must survive.
    expect(out).toContain('stroke-width="8"');
    expect(out).toContain('stroke-width="4"');
  });

  test("shortens colors and numbers", () => {
    const out = optimize(figma);
    expect(out).toContain("#fff");
    expect(out).not.toContain("10.00000");
  });

  test("makes files smaller", () => {
    const source = fixture("figma-export.svg");
    const result = optimizeSvg(tree(source), source, defaultOptimizeOptions);
    expect(result.after).toBeLessThan(result.before);
    expect(result.saved).toBeGreaterThan(0.3);
  });

  test("keeps an Iconify icon renderable", () => {
    const out = optimize(fixture("lucide-house.svg"));
    expect(out).toContain('viewBox="0 0 24 24"');
    expect(out.match(/<path/g)).toHaveLength(2);
    expect(out).toContain('stroke="currentColor"');
  });

  test("minified output parses again", () => {
    const again = parseSvg(minify(optimizeTree(tree(figma), defaultOptimizeOptions)));
    expect(again.ok).toBe(true);
  });
});

describe("converters", () => {
  const house = tree(fixture("lucide-house.svg"));

  test("JSX camel-cases attributes", () => {
    const jsx = toJsx(tree('<svg class="a" stroke-width="2" fill-rule="evenodd" xlink:href="#x"><path/></svg>'));
    expect(jsx).toContain("className=");
    expect(jsx).toContain("strokeWidth=");
    expect(jsx).toContain("fillRule=");
    expect(jsx).toContain("xlinkHref=");
    expect(jsx).not.toMatch(/stroke-width|class=/);
  });

  test("style strings become objects", () => {
    expect(toJsx(tree('<svg><rect style="opacity:.5; fill-rule: evenodd"/></svg>'))).toContain(
      'style={{ opacity: ".5", fillRule: "evenodd" }}',
    );
  });

  test("React component is a named, typed export", () => {
    const code = reactComponent(house, "house-icon.svg");
    expect(code).toMatch(/export function HouseIcon\(/);
    expect(code).toContain("SVGProps<SVGSVGElement>");
  });

  test("React Native uses react-native-svg elements", () => {
    const { code } = reactNativeComponent(house, "house.svg");
    expect(code).toContain('from "react-native-svg"');
    expect(code).toMatch(/<Path\b/);
    expect(code).not.toMatch(/<path\b/);
  });
});

describe("sprite builder", () => {
  const withGradient = (color: string) =>
    `<svg viewBox="0 0 10 10"><defs><linearGradient id="g"><stop stop-color="${color}"/></linearGradient></defs><rect fill="url(#g)" width="10" height="10"/><use href="#g"/></svg>`;

  test("namespaces ids and their references", () => {
    const sprite = buildSprite([
      { id: symbolId("one.svg"), source: withGradient("#abc") },
      { id: symbolId("two.svg"), source: withGradient("#def") },
    ]);
    expect(sprite).toContain('id="one_g"');
    expect(sprite).toContain('id="two_g"');
    expect(sprite).toContain("url(#one_g)");
    expect(sprite).toContain('href="#two_g"');
  });

  test("leaves hex colors alone", () => {
    const sprite = buildSprite([{ id: "icon", source: '<svg viewBox="0 0 10 10"><rect fill="#abc"/></svg>' }]);
    expect(sprite).toMatch(/fill="#abc"/);
    expect(sprite).not.toContain("#icon-abc");
  });

  test("symbol ids are safe slugs", () => {
    expect(symbolId("My Icon (1).svg")).toBe("my-icon-1");
    expect(symbolId("123.svg")).toBe("icon-123");
  });
});
