import { describe, expect, test } from "vitest";

import { backgroundCss } from "@/lib/background/export";
import { circuitTraces, type GridNode } from "@/lib/background/generators/circuit";
import { halftoneGradient, halftoneStrength } from "@/lib/background/generators/halftone";
import { triangleSlot } from "@/lib/background/generators/triangles";
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

describe.each(["plus", "starfield", "voronoi", "crosshatch", "circuit", "halftone", "triangles"] as const)(
  "%s",
  (kind) => {
    test("the same seed renders the same output", () => {
      for (const patch of [{ seed: 7 }, { seed: 7, rotation: 30, density: 100, scale: 2 }]) {
        expect(renderBackgroundSvg(settings(kind, patch))).toBe(renderBackgroundSvg(settings(kind, patch)));
      }
    });

    test("different seeds render different output", () => {
      expect(renderBackgroundSvg(settings(kind, { seed: 1 }))).not.toBe(
        renderBackgroundSvg(settings(kind, { seed: 2 })),
      );
    });

    test("exports a CSS rule", () => {
      expect(backgroundCss(settings(kind))).toContain("background-image:");
    });
  },
);

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
  // The fastest of five runs, so a busy machine (parallel test files, CI neighbours) does not
  // fail the test. The target is 100 ms on a laptop; leave headroom for slow CI machines.
  const times = [9, 10, 11, 12, 13].map((seed) => {
    const start = performance.now();
    renderBackgroundSvg(settings("voronoi", { density: 100, seed }));
    return performance.now() - start;
  });
  expect(Math.min(...times)).toBeLessThan(250);
});

test("crosshatch draws through a <pattern> and exports two crossing CSS gradients", () => {
  expect(renderBackgroundSvg(settings("crosshatch"))).toContain("<pattern");
  const css = backgroundCss(settings("crosshatch", { rotation: 30 }));
  expect(css).toContain("repeating-linear-gradient(30deg");
  expect(css).toContain("repeating-linear-gradient(120deg");
});

describe("circuit traces", () => {
  const traces = (seed: number) =>
    circuitTraces(createRandom(seed), { columns: 60, rows: 40, coverage: 0.6, maxTraces: 700 });

  test.each([1, 2, 3, 42])("never overlap or cross (seed %i)", (seed) => {
    const nodes = new Set<string>();
    const diagonals = new Set<string>();
    for (const trace of traces(seed)) {
      expect(trace.length).toBeGreaterThanOrEqual(3);
      trace.forEach(([x, y], i) => {
        // No node is used twice, by this trace or any other.
        expect(nodes.has(`${x},${y}`)).toBe(false);
        nodes.add(`${x},${y}`);
        const previous = trace[i - 1];
        if (!previous) return;
        const dx = x - previous[0];
        const dy = y - previous[1];
        expect(Math.max(Math.abs(dx), Math.abs(dy))).toBe(1);
        if (dx && dy) {
          // Two diagonals in one grid cell would cross in an X.
          const cell = `${Math.min(x, previous[0])},${Math.min(y, previous[1])}`;
          expect(diagonals.has(cell)).toBe(false);
          diagonals.add(cell);
        }
      });
    }
  });

  test("turn by at most 45 degrees at a time", () => {
    const angle = (a: GridNode, b: GridNode) => Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (const trace of traces(5)) {
      for (let i = 2; i < trace.length; i += 1) {
        let turn = Math.abs(angle(trace[i - 1]!, trace[i]!) - angle(trace[i - 2]!, trace[i - 1]!));
        if (turn > Math.PI) turn = 2 * Math.PI - turn;
        expect(turn).toBeLessThanOrEqual(Math.PI / 4 + 1e-9);
      }
    }
  });

  test("density adds traces and the SVG stays under 2,500 nodes", () => {
    const sparse = nodeCount(renderBackgroundSvg(settings("circuit", { density: 0 })));
    const dense = nodeCount(renderBackgroundSvg(settings("circuit", { density: 100 })));
    expect(dense).toBeGreaterThan(sparse * 2);
    for (const patch of [
      { density: 100, scale: 0.25 },
      { density: 100, width: 3840, height: 2160, scale: 0.25 },
    ]) {
      expect(nodeCount(renderBackgroundSvg(settings("circuit", patch)))).toBeLessThan(2500);
    }
  });
});

describe("halftone", () => {
  test("dots are largest at a radial gradient's center and fade toward the corners", () => {
    const gradient = { type: "radial", cx: 400, cy: 300, angle: 0 } as const;
    const strength = halftoneStrength(gradient, 1600, 900);
    expect(strength(400, 300)).toBe(1);
    expect(strength(1600, 900)).toBeCloseTo(0, 5);
    expect(strength(800, 300)).toBeLessThan(strength(500, 300));
  });

  test("a linear gradient runs from 0 to 1 across the canvas", () => {
    const strength = halftoneStrength({ type: "linear", cx: 800, cy: 450, angle: 0 }, 1600, 900);
    expect(strength(0, 450)).toBeCloseTo(0, 5);
    expect(strength(800, 0)).toBeCloseTo(0.5, 5);
    expect(strength(1600, 450)).toBeCloseTo(1, 5);
  });

  test("seeds pick both gradient types", () => {
    const types = new Set(
      Array.from({ length: 20 }, (_, seed) => halftoneGradient(settings("halftone", { seed })).type),
    );
    expect(types).toEqual(new Set(["linear", "radial"]));
  });

  test("the gradient option forces the type and keeps the seeded center and angle", () => {
    for (let seed = 0; seed < 10; seed += 1) {
      const seeded = halftoneGradient(settings("halftone", { seed }));
      expect(halftoneGradient(settings("halftone", { seed, options: { halftoneGradient: "seeded" } }))).toEqual(seeded);
      for (const type of ["linear", "radial"] as const) {
        const forced = halftoneGradient(settings("halftone", { seed, options: { halftoneGradient: type } }));
        expect(forced).toEqual({ ...seeded, type });
      }
    }
  });

  test("renders the same output without options as before they existed", () => {
    expect(renderBackgroundSvg(settings("halftone"))).toBe(
      renderBackgroundSvg(settings("halftone", { options: { halftoneGradient: "seeded" } })),
    );
  });

  test("keeps the SVG small, even on a 4K canvas", () => {
    const svg = renderBackgroundSvg(settings("halftone", { density: 100, width: 3840, height: 2160 }));
    expect(nodeCount(svg)).toBeLessThan(20);
    expect((svg.match(/M/g) ?? []).length).toBeLessThan(6600);
  });
});

describe("triangles", () => {
  test("draws through a <pattern>", () => {
    expect(renderBackgroundSvg(settings("triangles"))).toContain("<pattern");
  });

  test.each([2, 3, 4, 5, 6])("no two triangles that share an edge get the same color (%i colors)", (count) => {
    for (let row = 0; row < 6; row += 1) {
      for (let column = -1; column < 12; column += 1) {
        const slot = triangleSlot(column, row, count, 1);
        expect(triangleSlot(column + 1, row, count, 1)).not.toBe(slot);
        expect(triangleSlot(column, row + 1, count, 1)).not.toBe(slot);
      }
    }
  });

  test("density sets the triangle size", () => {
    const tileWidth = (svg: string) => Number(/<pattern[^>]* width="([\d.]+)"/.exec(svg)?.[1]);
    const sparse = tileWidth(renderBackgroundSvg(settings("triangles", { density: 0 })));
    const dense = tileWidth(renderBackgroundSvg(settings("triangles", { density: 100 })));
    expect(sparse).toBeGreaterThan(dense * 3);
  });
});
