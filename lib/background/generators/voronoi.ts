import { colorRamp } from "@/lib/background/palette";
import { createRandom, pick, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

export type Point = readonly [number, number];

export type VoronoiCell = {
  polygon: Point[];
  /** Indexes of the sites whose cells share an edge with this one. */
  neighbors: number[];
};

/** A polygon vertex, tagged with the site across the edge that starts at it (-1 for the bounds). */
type Vertex = { point: Point; across: number };

/**
 * Keeps the part of `polygon` closer to `site` than to `other` (index `otherIndex`): a
 * Sutherland-Hodgman clip against the perpendicular bisector of the two sites.
 */
function clipToBisector(polygon: Vertex[], site: Point, other: Point, otherIndex: number): Vertex[] {
  const nx = other[0] - site[0];
  const ny = other[1] - site[1];
  const c = (nx * (site[0] + other[0]) + ny * (site[1] + other[1])) / 2;
  // Negative means the vertex is on the site's side of the bisector.
  const sides = polygon.map(({ point }) => nx * point[0] + ny * point[1] - c);
  // Most far-away sites don't touch the cell at all; skip the copy.
  if (sides.every((side) => side <= 0)) return polygon;
  const out: Vertex[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const sa = sides[i]!;
    const sb = sides[(i + 1) % polygon.length]!;
    if (sa <= 0) out.push(sa === 0 && sb > 0 ? { point: a.point, across: otherIndex } : a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      const point: Point = [a.point[0] + (b.point[0] - a.point[0]) * t, a.point[1] + (b.point[1] - a.point[1]) * t];
      // Leaving: the new edge runs along the bisector. Entering: it continues the old edge.
      out.push({ point, across: sa < 0 ? otherIndex : a.across });
    }
  }
  return out;
}

/** Grid offsets within two cells, nearest first, so the polygon shrinks as early as possible. */
const OFFSETS = Array.from({ length: 25 }, (_, i) => [(i % 5) - 2, Math.floor(i / 5) - 2] as const)
  .filter(([dx, dy]) => dx !== 0 || dy !== 0)
  .sort((a, b) => a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2));

/**
 * Voronoi cells of sites laid out one per grid cell (`columns` × `rows`, row by row), clipped to
 * the rectangle from (-pad, -pad) to (width + pad, height + pad). With one site per grid cell, a
 * site's neighbours lie within two grid cells, so each cell is the rectangle clipped against the
 * 24 sites around it. Together the cells tile the rectangle exactly, with no gaps or overlaps.
 */
export function voronoiCells(
  sites: Point[],
  columns: number,
  rows: number,
  width: number,
  height: number,
  pad = 0,
): VoronoiCell[] {
  return sites.map((site, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    let polygon: Vertex[] = [
      { point: [-pad, -pad], across: -1 },
      { point: [width + pad, -pad], across: -1 },
      { point: [width + pad, height + pad], across: -1 },
      { point: [-pad, height + pad], across: -1 },
    ];
    for (const [dx, dy] of OFFSETS) {
      const x = column + dx;
      const y = row + dy;
      if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
      polygon = clipToBisector(polygon, site, sites[y * columns + x]!, y * columns + x);
      if (polygon.length === 0) break;
    }
    const neighbors = [...new Set(polygon.map((vertex) => vertex.across).filter((across) => across >= 0))];
    return { polygon: polygon.map((vertex) => vertex.point), neighbors };
  });
}

/** Seeded Voronoi cells filled with the palette, outlined in the canvas color. */
export const voronoi: BackgroundDefinition = {
  kind: "voronoi",
  label: "Voronoi",
  description: "Organic cells in your palette, outlined in the canvas color.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height, density, seed, scale } = settings;
    const random = createRandom(seed);
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    // At least five fills, so neighbouring cells can almost always differ: short palettes get
    // in-between shades (toward the canvas color for a single color). Every fill stays opaque.
    const fills =
      colors.length >= 5
        ? colors
        : colors.length > 1
          ? colorRamp(colors, colors.length * 2 - 1 >= 5 ? colors.length * 2 - 1 : 5)
          : colorRamp([colors[0]!, settings.background], 7).slice(0, 5);
    // Density sets the cell size (and so the count): about 110 cells at 0 up to 2,300 at 100 in Full HD.
    const cell = 140 - (density / 100) * 110;
    const columns = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const cw = width / columns;
    const ch = height / rows;
    // Each site sits somewhere inside its own grid cell, which keeps neighbour lookup local.
    const sites: Point[] = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        sites.push([(x + range(random, 0.08, 0.92)) * cw, (y + range(random, 0.08, 0.92)) * ch]);
      }
    }
    // Scale sets the outline width; at 0.5× and below the outline is off.
    const outline = r1(Math.max(0, scale - 0.5) * Math.min(cw, ch) * 0.05);
    // Cells extend past the canvas by the outline width, so no outline runs along the canvas edge.
    const cells = voronoiCells(sites, columns, rows, width, height, outline);
    // Neighbours avoid each other's color where the palette allows, so cells don't merge into blobs.
    const assigned: string[] = [];
    const paths = cells.map(({ polygon, neighbors }, index) => {
      const taken = new Set(neighbors.filter((neighbor) => neighbor < index).map((neighbor) => assigned[neighbor]));
      const free = fills.filter((fill) => !taken.has(fill));
      const color = pick(random, free.length ? free : fills);
      assigned.push(color);
      const d = `M${polygon.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}Z`;
      // Without an outline, a hairline stroke in the fill color hides antialiasing seams.
      const seam = outline ? "" : ` stroke="${color}" stroke-width=".6"`;
      return `<path d="${d}" fill="${color}"${seam}/>`;
    });
    const body = outline
      ? `<g stroke="${settings.background}" stroke-width="${outline}" stroke-linejoin="round">${paths.join("")}</g>`
      : paths.join("");
    return wrapSvg(settings, body);
  },
};
