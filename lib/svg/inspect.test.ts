import { describe, expect, test } from "vitest";

import { pathLength, shapeLength } from "@/lib/svg/inspect";

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
