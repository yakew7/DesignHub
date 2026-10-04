import { createRandom, pick, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** A grid node, as [column, row]. */
export type GridNode = readonly [number, number];

/** The eight directions, clockwise from east, so one index step is a 45 degree turn. */
const DIRECTIONS: readonly GridNode[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

export type CircuitOptions = {
  columns: number;
  rows: number;
  /** Share of the grid nodes the traces should cover, 0 to 1. */
  coverage: number;
  /** Hard cap on the number of traces, which keeps the SVG small. */
  maxTraces: number;
};

/**
 * Seeded traces on a `columns` × `rows` grid. Each trace walks from node to node, turning by 45
 * degrees at most at each node, and ends where it would run into something. Traces never share a
 * node, and two diagonal steps never cross inside the same grid cell, so no two traces overlap.
 */
export function circuitTraces(random: () => number, options: CircuitOptions): GridNode[][] {
  const { columns, rows, coverage, maxTraces } = options;
  const used = new Set<number>();
  // A grid cell holds at most one diagonal step, keyed by the cell's top-left node.
  const diagonals = new Set<number>();
  const key = (x: number, y: number) => y * columns + x;
  const inside = (x: number, y: number) => x >= 0 && x < columns && y >= 0 && y < rows;
  const target = Math.floor(columns * rows * coverage);
  const traces: GridNode[][] = [];
  let covered = 0;
  // Attempts are bounded so a crowded grid still finishes quickly.
  for (let attempt = 0; attempt < maxTraces * 8 && traces.length < maxTraces && covered < target; attempt += 1) {
    const start: GridNode = [Math.floor(random() * columns), Math.floor(random() * rows)];
    if (used.has(key(start[0], start[1]))) continue;
    // Mostly horizontal and vertical starts, the way real boards are routed.
    let direction = random() < 0.75 ? Math.floor(random() * 4) * 2 : Math.floor(random() * 4) * 2 + 1;
    const length = 3 + Math.floor(random() * 14);
    const nodes: GridNode[] = [start];
    const ownNodes = new Set([key(start[0], start[1])]);
    const ownDiagonals = new Set<number>();
    for (let step = 0; step < length; step += 1) {
      if (step > 0 && random() < 0.22) direction = (direction + (random() < 0.5 ? 1 : 7)) % 8;
      const [x, y] = nodes[nodes.length - 1]!;
      const [dx, dy] = DIRECTIONS[direction]!;
      const nx = x + dx;
      const ny = y + dy;
      if (!inside(nx, ny) || used.has(key(nx, ny)) || ownNodes.has(key(nx, ny))) break;
      if (dx !== 0 && dy !== 0) {
        const cell = key(Math.min(x, nx), Math.min(y, ny));
        if (diagonals.has(cell) || ownDiagonals.has(cell)) break;
        ownDiagonals.add(cell);
      }
      ownNodes.add(key(nx, ny));
      nodes.push([nx, ny]);
    }
    // Too short to read as a trace: drop it and leave its nodes free.
    if (nodes.length < 3) continue;
    for (const node of ownNodes) used.add(node);
    for (const cell of ownDiagonals) diagonals.add(cell);
    covered += nodes.length;
    traces.push(nodes);
  }
  return traces;
}

/** Drops the nodes in the middle of straight runs, so a path only lists its corners. */
function corners(nodes: GridNode[]): GridNode[] {
  return nodes.filter((node, i) => {
    const before = nodes[i - 1];
    const after = nodes[i + 1];
    if (!before || !after) return true;
    return node[0] - before[0] !== after[0] - node[0] || node[1] - before[1] !== after[1] - node[1];
  });
}

/** Seeded circuit-board traces with 45 degree turns, each ending in a round pad. */
export const circuit: BackgroundDefinition = {
  kind: "circuit",
  label: "Circuit",
  description: "Circuit-board traces with 45 degree turns, ending in pads.",
  defaults: { density: 50, scale: 1 },
  render(settings) {
    const { width, height, density, scale } = settings;
    const random = createRandom(settings.seed);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    // Scale sets the grid pitch, and with it the trace width and pad size.
    const cell = Math.max(10, 30 * scale);
    // One extra node on each side, so traces run off the canvas instead of stopping at its edge.
    const columns = Math.ceil(width / cell) + 3;
    const rows = Math.ceil(height / cell) + 3;
    const traces = circuitTraces(random, {
      columns,
      rows,
      coverage: 0.12 + (density / 100) * 0.5,
      maxTraces: 700,
    });
    const stroke = r1(cell * 0.14);
    // Pads stay well inside the 0.7-cell gap to the nearest other trace.
    const pad = r1(cell * 0.24);
    const at = ([x, y]: GridNode) => `${r1((x - 1) * cell)} ${r1((y - 1) * cell)}`;
    const byColor = new Map<string, { paths: string[]; pads: string[] }>();
    for (const nodes of traces) {
      const color = pick(random, colors);
      const group = byColor.get(color) ?? { paths: [], pads: [] };
      byColor.set(color, group);
      group.paths.push(`M${corners(nodes).map(at).join("L")}`);
      for (const end of [nodes[0]!, nodes[nodes.length - 1]!]) {
        const [x, y] = at(end).split(" ");
        group.pads.push(`<circle cx="${x}" cy="${y}" r="${pad}"/>`);
      }
    }
    // One path per color for the traces; pads are rings in the canvas color, like drilled vias.
    const body = [...byColor]
      .map(
        ([color, { paths, pads }]) =>
          `<path d="${paths.join("")}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<g fill="${settings.background}" stroke="${color}" stroke-width="${stroke}">${pads.join("")}</g>`,
      )
      .join("");
    return wrapSvg(settings, body);
  },
};
