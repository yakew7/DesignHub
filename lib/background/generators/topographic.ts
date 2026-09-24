import { smoothPath, type Point } from "@/lib/background/path";
import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

const COLS = 64;
const OCTAVES = 3;
/** Every fifth contour is drawn heavier, like an index contour on a map. */
const INDEX_EVERY = 5;

type Field = { cols: number; rows: number; values: Float32Array };
type Segment = [number, number];

const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Seeded fractal value noise sampled on a (cols + 1) x (rows + 1) grid of nodes. */
function noiseField(random: () => number, cols: number, rows: number, frequency: number): Field {
  const values = new Float32Array((cols + 1) * (rows + 1));
  let amplitude = 1;
  for (let octave = 0; octave < OCTAVES; octave += 1) {
    const f = frequency * 2 ** octave;
    const lw = Math.ceil(f) + 2;
    const lh = Math.ceil((f * rows) / cols) + 2;
    const lattice = Float32Array.from({ length: lw * lh }, () => random());
    const at = (x: number, y: number) => lattice[y * lw + x]!;
    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        const u = (i / cols) * f;
        const v = (j / cols) * f;
        const x0 = Math.floor(u);
        const y0 = Math.floor(v);
        const sx = quintic(u - x0);
        const sy = quintic(v - y0);
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
        values[j * (cols + 1) + i]! += amplitude * (top + (bottom - top) * sy);
      }
    }
    amplitude /= 2;
  }
  return { cols, rows, values };
}

/**
 * Marching squares for one level. Edges are numbered so neighbouring cells agree on
 * them: horizontal edge (i, j) is 2 * (j * (cols + 1) + i), the vertical one is that + 1.
 */
function levelSegments({ cols, rows, values }: Field, level: number): Segment[] {
  const stride = cols + 1;
  const h = (i: number, j: number) => 2 * (j * stride + i);
  const v = (i: number, j: number) => 2 * (j * stride + i) + 1;
  const segments: Segment[] = [];
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const tl = values[j * stride + i]!;
      const tr = values[j * stride + i + 1]!;
      const br = values[(j + 1) * stride + i + 1]!;
      const bl = values[(j + 1) * stride + i]!;
      const code = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const top = h(i, j);
      const bottom = h(i, j + 1);
      const left = v(i, j);
      const right = v(i + 1, j);
      const centerHigh = (tl + tr + br + bl) / 4 >= level;
      const cutTl: Segment = [top, left];
      const cutTr: Segment = [top, right];
      const cutBr: Segment = [bottom, right];
      const cutBl: Segment = [left, bottom];
      switch (code) {
        case 1:
        case 14:
          segments.push(cutBl);
          break;
        case 2:
        case 13:
          segments.push(cutBr);
          break;
        case 3:
        case 12:
          segments.push([left, right]);
          break;
        case 4:
        case 11:
          segments.push(cutTr);
          break;
        case 6:
        case 9:
          segments.push([top, bottom]);
          break;
        case 7:
        case 8:
          segments.push(cutTl);
          break;
        case 5:
          // Saddle: the center decides which pair of corners is joined.
          segments.push(...(centerHigh ? [cutTl, cutBr] : [cutTr, cutBl]));
          break;
        default:
          segments.push(...(centerHigh ? [cutTr, cutBl] : [cutTl, cutBr]));
      }
    }
  }
  return segments;
}

/** Joins segments that share an edge into polylines, as edge ids plus whether the line closes. */
function chain(segments: Segment[]): { edges: number[]; closed: boolean }[] {
  const byEdge = new Map<number, number[]>();
  segments.forEach(([a, b], index) => {
    byEdge.set(a, [...(byEdge.get(a) ?? []), index]);
    byEdge.set(b, [...(byEdge.get(b) ?? []), index]);
  });
  const used = new Set<number>();
  const next = (edge: number) => byEdge.get(edge)?.find((index) => !used.has(index));
  const other = (index: number, edge: number) =>
    segments[index]![0] === edge ? segments[index]![1] : segments[index]![0];

  const lines: { edges: number[]; closed: boolean }[] = [];
  for (let start = 0; start < segments.length; start += 1) {
    if (used.has(start)) continue;
    used.add(start);
    const edges = [segments[start]![0], segments[start]![1]];
    let closed = false;
    for (let tail = edges[1]!, index = next(tail); index !== undefined; index = next(tail)) {
      used.add(index);
      tail = other(index, tail);
      if (tail === edges[0]) {
        closed = true;
        break;
      }
      edges.push(tail);
    }
    if (!closed) {
      for (let head = edges[0]!, index = next(head); index !== undefined; index = next(head)) {
        used.add(index);
        head = other(index, head);
        edges.unshift(head);
      }
    }
    lines.push({ edges, closed });
  }
  return lines;
}

/** Every other point of a long line: the spline rebuilds the curve and the file stays small. */
function thin(points: Point[], closed: boolean): Point[] {
  if (points.length < 8) return points;
  const kept = points.filter((_, index) => index % 2 === 0);
  const last = points[points.length - 1]!;
  if (!closed && kept[kept.length - 1] !== last) kept.push(last);
  return kept;
}

/** Contour lines of a seeded noise field, like the relief on a map. */
export const topographic: BackgroundDefinition = {
  kind: "topographic",
  label: "Topographic",
  description: "Smooth contour lines, like a map.",
  defaults: { density: 50, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed, colors } = settings;
    const random = createRandom(seed);
    const cols = COLS;
    const rows = Math.max(8, Math.round((COLS * height) / width));
    const field = noiseField(random, cols, rows, 2.6 / scale);

    let low = Infinity;
    let high = -Infinity;
    for (const value of field.values) {
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    const count = Math.round(6 + (density / 100) * 18);
    const cellW = width / cols;
    const cellH = height / rows;
    const stroke = Math.max(1, (width / 1920) * 1.6);
    const palette = colors.length ? colors : ["#888888"];

    const paths = Array.from({ length: count }, (_, index) => {
      const level = low + ((index + 1) / (count + 1)) * (high - low);
      const point = (edge: number): Point => {
        const node = edge >> 1;
        const i = node % (cols + 1);
        const j = Math.floor(node / (cols + 1));
        const at = (di: number, dj: number) => field.values[(j + dj) * (cols + 1) + i + di]!;
        const vertical = (edge & 1) === 1;
        const a = at(0, 0);
        const b = vertical ? at(0, 1) : at(1, 0);
        const t = b === a ? 0.5 : Math.min(1, Math.max(0, (level - a) / (b - a)));
        return vertical ? [i * cellW, (j + t) * cellH] : [(i + t) * cellW, j * cellH];
      };
      const d = chain(levelSegments(field, level))
        .map(({ edges, closed }) => smoothPath(thin(edges.map(point), closed), closed))
        .join("");
      const heavy = index % INDEX_EVERY === 0;
      return `<path d="${d}" stroke="${palette[index % palette.length]}" stroke-width="${r1(heavy ? stroke * 2 : stroke)}"/>`;
    });

    return wrapSvg(settings, `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${paths.join("")}</g>`);
  },
};
