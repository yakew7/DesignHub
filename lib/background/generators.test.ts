import { describe, expect, test } from "vitest";

import { backgroundCss } from "@/lib/background/export";
import { voronoiCells, type Point } from "@/lib/background/generators/voronoi";
import { createRandom } from "@/lib/background/random";
import { renderBackgroundSvg } from "@/lib/background/registry";
import type { BackgroundKind, BackgroundSettings } from "@/types/background";

const settings = (kind: BackgroundKind, patch: Partial<BackgroundSettings> = {}): BackgroundSettings => ({
  kind,
  seed: 42,
  colors: ["#6366f1", "#ec4899", "#f59e0b"],
  background: "#0b1020",
  density: 50,
  scale: 1,
  rotation: 0,
  width: 1920,
  height: 1080,
  ...patch,
});

const nodeCount = (svg: string) => (svg.match(/<[a-zA-Z]/g) ?? []).length;

describe.each(["plus", "starfield", "voronoi"] as const)("%s", (kind) => {
  test("the same seed renders the same output", () => {
    for (const patch of [{ seed: 7 }, { seed: 7, rotation: 30, density: 100, scale: 2 }]) {
      expect(renderBackgroundSvg(settings(kind, patch))).toBe(renderBackgroundSvg(settings(kind, patch)));
    }
  });

  test("different seeds render different output", () => {
    expect(renderBackgroundSvg(settings(kind, { seed: 1 }))).not.toBe(renderBackgroundSvg(settings(kind, { seed: 2 })));
  });

  test("exports a CSS rule", () => {
    expect(backgroundCss(settings(kind))).toContain("background-image:");
  });
});

test("plus draws through a <pattern>", () => {
  expect(renderBackgroundSvg(settings("plus"))).toContain("<pattern");
});

test("starfield density controls the star count and stays under 1,500 nodes", () => {
  const sparse = nodeCount(renderBackgroundSvg(settings("starfield", { density: 0 })));
  const dense = nodeCount(renderBackgroundSvg(settings("starfield", { density: 100 })));
  expect(dense).toBeGreaterThan(sparse * 3);
  for (const [width, height] of [
    [1920, 1080],
    [1080, 1920],
    [1600, 900],
  ] as const) {
    expect(nodeCount(renderBackgroundSvg(settings("starfield", { density: 100, width, height })))).toBeLessThan(1500);
  }
});

function polygonArea(polygon: Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) / 2;
}

test.each([
  [1920, 1080, 140, 1],
  [1920, 1080, 30, 2],
  [1080, 1920, 50, 3],
  [1200, 630, 90, 4],
])("voronoi cells tile a %ix%i canvas with no gaps (cell %i, seed %i)", (width, height, cell, seed) => {
  const random = createRandom(seed);
  const columns = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const sites: Point[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      sites.push([((x + 0.08 + random() * 0.84) * width) / columns, ((y + 0.08 + random() * 0.84) * height) / rows]);
    }
  }
  const cells = voronoiCells(sites, columns, rows, width, height);
  // Each cell is clipped against a subset of the sites, so it can only be too big, never too
  // small. If the areas add up to the canvas exactly, the cells cover it with no gaps or overlaps.
  const total = cells.reduce((sum, { polygon }) => sum + polygonArea(polygon), 0);
  expect(total).toBeCloseTo(width * height, 3);
  expect(cells.every(({ polygon }) => polygon.length >= 3)).toBe(true);
  // Adjacency is symmetric: if A borders B, B borders A.
  cells.forEach(({ neighbors }, index) => {
    for (const neighbor of neighbors) expect(cells[neighbor]!.neighbors).toContain(index);
  });
});

test("voronoi renders the largest density quickly", () => {
  renderBackgroundSvg(settings("voronoi", { density: 100 }));
  const start = performance.now();
  renderBackgroundSvg(settings("voronoi", { density: 100, seed: 9 }));
  // The target is 100 ms on a laptop; leave headroom for slow CI machines.
  expect(performance.now() - start).toBeLessThan(250);
});
