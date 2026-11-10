import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { catalogs } from "@/lib/i18n/all-catalogs";
import { createTranslator } from "@/lib/i18n/translate";
import { svgFormatName, svgFormats } from "@/lib/svg/formats";
import { withCurrentColor } from "@/lib/svg/jsx";
import { defaultOptimizeOptions, optimizeSvg, optimizeTree } from "@/lib/svg/optimize";
import { parseSvg } from "@/lib/svg/parse";
import { reactNativeComponent } from "@/lib/svg/react-native";
import { sampleSvg } from "@/lib/svg/sample";

/**
 * Every output of the SVG Playground for a sample SVG, byte for byte, with and without currentColor and with a
 * sprite. A change to how a converter writes its component (or to a helper converters share) must not move a
 * character by accident: a change on purpose shows up as a diff of these files, accepted with
 * `pnpm vitest run lib/svg -u` and read like any other change.
 */
const DIR = join(__dirname, "__snapshots__");

const parsed = parseSvg(sampleSvg);
if (!parsed.ok) throw new Error("the sample SVG must parse");
const root = parsed.root;
const tree = optimizeTree(root, defaultOptimizeOptions);
const optimized = optimizeSvg(root, sampleSvg, defaultOptimizeOptions);
const sprite = [
  { id: "badge", source: sampleSvg },
  {
    id: "dot",
    source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>',
  },
];

const cases = [
  { name: "plain", currentColor: false, sprite: [] },
  { name: "current-color", currentColor: true, sprite },
] as const;

const file = (set: string, id: string, filename: string) => `${set}.${id}.${filename.replace(/[\\/]/g, "_")}.txt`;

function build(currentColor: boolean, items: typeof sprite) {
  const native = reactNativeComponent(currentColor ? withCurrentColor(tree) : tree, "badge.svg");
  return svgFormats({ root, optimized, tree, native, currentColor, name: "badge.svg", sprite: items });
}

describe.each(cases)("SVG Playground outputs ($name)", ({ name, currentColor, sprite: items }) => {
  const formats = build(currentColor, [...items]);

  test.each(formats.map((format) => [format.id, format] as const))("%s is unchanged", async (_id, format) => {
    await expect(format.code).toMatchFileSnapshot(`./__snapshots__/${file(name, format.id, format.filename)}`);
  });
});

describe("the snapshot folder", () => {
  test("has a file for every output of every case, and nothing left from a removed one", () => {
    const expected = cases.flatMap(({ name, currentColor, sprite: items }) =>
      build(currentColor, [...items]).map((format) => file(name, format.id, format.filename)),
    );
    expect(readdirSync(DIR).sort()).toEqual(expected.sort());
  });

  test("builds nothing without a parsed SVG", () => {
    expect(
      svgFormats({
        root: null,
        optimized: null,
        tree: null,
        native: null,
        currentColor: false,
        name: "x.svg",
        sprite: [],
      }),
    ).toEqual([]);
  });

  test("the formats' ids are unique", () => {
    const ids = build(true, [...sprite]).map((format) => format.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

test("format names follow the selected language and retain other format names", () => {
  const { t } = createTranslator(catalogs.es, "es");
  const formats = build(false, []);
  expect(formats.slice(0, 4).map((format) => svgFormatName(t, format))).toEqual([
    "Optimizado",
    "Con formato",
    "Minificado",
    "JSX",
  ]);
  expect(svgFormatName(t, { id: "react", label: "React" })).toBe("React");
});
