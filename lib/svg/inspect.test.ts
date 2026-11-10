import { describe, expect, test } from "vitest";

import { catalogs } from "@/lib/i18n/all-catalogs";
import { createTranslator } from "@/lib/i18n/translate";
import { inspectPath, pathLength, shapeLength } from "@/lib/svg/inspect";

test("invalid paths have a translated explanation and the parser detail", () => {
  const report = inspectPath("M0 0 L");
  expect(report.error).toBeTruthy();
  const { t } = createTranslator(catalogs.es, "es");
  expect(t("svg.error.path", { detail: report.error! })).toBe(`El trazado no es válido: ${report.error}`);
});

describe("pathLength", () => {
  test("straight segments, relative commands and closepath", () => {
    expect(pathLength("M0 0 H10 V10 H0 Z")).toBeCloseTo(40, 6);
    expect(pathLength("m0 0 l3 4")).toBeCloseTo(5, 6);
  });

  test("a straight cubic and quadratic measure as lines", () => {
    expect(pathLength("M0 0 C 3 0 6 0 10 0")).toBeCloseTo(10, 3);
    expect(pathLength("M0 0 Q 5 0 10 0")).toBeCloseTo(10, 3);
  });

  test("two half-circle arcs make a full circle", () => {
    expect(pathLength("M0 10 A10 10 0 0 1 20 10 A10 10 0 0 1 0 10")).toBeCloseTo(2 * Math.PI * 10, 1);
  });

  test("a quarter circle as a cubic is close to its true length", () => {
    const k = 0.5522847498 * 10;
    expect(pathLength(`M10 0 C10 ${k} ${k} 10 0 10`)).toBeCloseTo((Math.PI * 10) / 2, 1);
  });

  test("smooth commands reflect the previous control point", () => {
    const k = 0.5522847498 * 10;
    // A half circle from two quarter cubics, the second written with S.
    expect(pathLength(`M0 -10 C${k} -10 10 ${-k} 10 0 S${k} 10 0 10`)).toBeCloseTo(Math.PI * 10, 1);
  });

  test("returns null for invalid data", () => {
    expect(pathLength("M0 0 L")).toBeNull();
  });
});

describe("shapeLength", () => {
  test("measures basic shapes", () => {
    expect(shapeLength("circle", { r: "10" })).toBeCloseTo(2 * Math.PI * 10, 6);
    expect(shapeLength("rect", { width: "10", height: "20" })).toBeCloseTo(60, 6);
    expect(shapeLength("line", { x1: "0", y1: "0", x2: "3", y2: "4" })).toBeCloseTo(5, 6);
    expect(shapeLength("polygon", { points: "0,0 10,0 10,10" })).toBeCloseTo(20 + Math.SQRT2 * 10, 6);
    expect(shapeLength("polyline", { points: "0 0 10 0 10 10" })).toBeCloseTo(20, 6);
    expect(shapeLength("ellipse", { rx: "10", ry: "10" })).toBeCloseTo(2 * Math.PI * 10, 6);
  });

  test("a fully rounded square is a circle", () => {
    expect(shapeLength("rect", { width: "20", height: "20", rx: "10" })).toBeCloseTo(2 * Math.PI * 10, 6);
  });

  test("viewport-relative sizes and other elements are unknown", () => {
    expect(shapeLength("circle", { r: "50%" })).toBeNull();
    expect(shapeLength("text", {})).toBeNull();
  });
});

/** Within 1% of a length worked out by hand. */
const near = (actual: number | null, expected: number) => {
  expect(actual).not.toBeNull();
  expect(Math.abs(actual! - expected) / expected).toBeLessThan(0.01);
};

describe("known lengths", () => {
  test("a line", () => {
    near(pathLength("M0 0 L30 40"), 50);
    near(shapeLength("line", { x1: "10", y1: "10", x2: "40", y2: "50" }), 50);
  });

  test("a rectangle, square and rounded", () => {
    const rounded = 2 * 30 + 2 * 20 + 2 * Math.PI * 5;
    near(pathLength("M0 0 H40 V30 H0 Z"), 140);
    near(shapeLength("rect", { x: "5", y: "5", width: "40", height: "30" }), 140);
    // Straight sides of 30 and 20, plus four quarter circles of radius 5.
    near(shapeLength("rect", { width: "40", height: "30", rx: "5" }), rounded);
    near(shapeLength("rect", { width: "40", height: "30", ry: "5" }), rounded);
    // "auto" takes the other radius, as in SVG 2.
    near(shapeLength("rect", { width: "40", height: "30", rx: "auto", ry: "5" }), rounded);
    // Each radius is capped at half its side, so huge corners turn the rect into an ellipse.
    near(shapeLength("rect", { width: "40", height: "20", rx: "50" }), shapeLength("ellipse", { rx: "20", ry: "10" })!);
  });

  test("a circle", () => {
    near(shapeLength("circle", { cx: "50", cy: "50", r: "25" }), 2 * Math.PI * 25);
    near(pathLength("M25 50 A25 25 0 0 1 75 50 A25 25 0 0 1 25 50"), 2 * Math.PI * 25);
  });

  test("a cubic", () => {
    // The parabola y = x² / 100 from 0 to 100, as a cubic and as the quadratic it elevates from.
    const parabola = (100 * (2 * Math.sqrt(5) + Math.asinh(2))) / 4;
    near(pathLength("M0 0 C33.3333333 0 66.6666667 33.3333333 100 100"), parabola);
    near(pathLength("M0 0 Q50 0 100 100"), parabola);
  });

  test("an arc", () => {
    near(pathLength("M0 0 A50 50 0 0 1 100 0"), Math.PI * 50);
    // The large arc of a radius 10 circle through two points 10 apart covers 300 degrees.
    near(pathLength("M0 0 A10 10 0 1 1 10 0"), ((2 * Math.PI * 10) / 6) * 5);
    // Radii too small to reach the end point grow until they do: a half circle of radius 10.
    near(pathLength("M0 0 A1 1 0 0 1 20 0"), Math.PI * 10);
    // A full ellipse from two arcs matches the ellipse perimeter.
    near(pathLength("M0 5 A10 5 0 0 1 20 5 A10 5 0 0 1 0 5"), shapeLength("ellipse", { rx: "10", ry: "5" })!);
  });
});

describe("relative and absolute commands", () => {
  test.each([
    ["M0 0 l30 40", "M0 0 L30 40"],
    ["M0 0 h10 v10 z m20 0 h10 v10 z", "M0 0 H10 V10 Z M20 0 H30 V10 Z"],
    ["M5 5 m5 0 l0 10", "M10 5 L10 15"],
    ["M0 0 c3 4 6 4 10 0 s5 -4 10 0", "M0 0 C3 4 6 4 10 0 S15 -4 20 0"],
    ["M0 0 q5 5 10 0 t10 0", "M0 0 Q5 5 10 0 T20 0"],
    ["M10 0 a10 10 0 0 1 -10 10", "M10 0 A10 10 0 0 1 0 10"],
    ["M0 0 a10 5 30 1 0 20 0", "M0 0 A10 5 30 1 0 20 0"],
  ])("%s measures the same as %s", (relative, absolute) => {
    expect(pathLength(relative)).toBeCloseTo(pathLength(absolute)!, 9);
  });
});
