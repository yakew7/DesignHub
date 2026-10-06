import { makeAbsolute, parseSVG } from "svg-path-parser";

export type PathCommandSummary = { code: string; label: string; values: string };

export type PathReport = {
  commands: PathCommandSummary[];
  counts: Record<string, number>;
  subpaths: number;
  bounds: { x: number; y: number; width: number; height: number } | null;
  error?: string;
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Command-level breakdown of path data, powered by svg-path-parser. */
export function inspectPath(d: string): PathReport {
  try {
    const parsed = parseSVG(d);
    const absolute = makeAbsolute(parseSVG(d));
    const counts: Record<string, number> = {};
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    absolute.forEach((command) => {
      counts[command.command] = (counts[command.command] ?? 0) + 1;
      const points: [number, number][] = [[command.x, command.y]];
      if ("x1" in command) points.push([command.x1, command.y1]);
      if ("x2" in command) points.push([command.x2, command.y2]);
      points.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });
    const commands = parsed.map((command) => {
      const values = Object.entries(command)
        .filter(([key]) => key !== "code" && key !== "command" && key !== "relative")
        .map(([, value]) => (typeof value === "number" ? round(value) : value ? 1 : 0))
        .join(" ");
      return { code: command.code, label: command.command, values };
    });
    return {
      commands,
      counts,
      subpaths: parsed.filter((command) => command.code === "M" || command.code === "m").length,
      // Control points are included, so this is a safe outer bound rather than the tight curve bounds.
      bounds: Number.isFinite(minX)
        ? { x: round(minX), y: round(minY), width: round(maxX - minX), height: round(maxY - minY) }
        : null,
    };
  } catch (error) {
    return {
      commands: [],
      counts: {},
      subpaths: 0,
      bounds: null,
      error: error instanceof Error ? error.message : "Invalid path",
    };
  }
}

type Point = { x: number; y: number };

/** Steps per curve segment when measuring. Well under 0.1% error on logo-sized curves. */
const CURVE_STEPS = 48;

function polylineLength(at: (t: number) => Point): number {
  let length = 0;
  let previous = at(0);
  for (let i = 1; i <= CURVE_STEPS; i += 1) {
    const point = at(i / CURVE_STEPS);
    length += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }
  return length;
}

function cubicLength(p0: Point, p1: Point, p2: Point, p3: Point): number {
  return polylineLength((t) => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  });
}

function quadraticLength(p0: Point, p1: Point, p2: Point): number {
  return polylineLength((t) => {
    const u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
  });
}

type Arc = { rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean };

/** An elliptical arc, converted to center form as in the SVG spec (implementation notes, B.2.4). */
function arcLength(from: Point, to: Point, arc: Arc): number {
  let rx = Math.abs(arc.rx);
  let ry = Math.abs(arc.ry);
  if (rx === 0 || ry === 0) return Math.hypot(to.x - from.x, to.y - from.y);
  const phi = (arc.rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from.x - to.x) / 2;
  const dy = (from.y - to.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  // Radii too small to reach the end point scale up until they just do.
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const factor = (arc.largeArc === arc.sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator) / (denominator || 1));
  const cx1 = (factor * rx * y1) / ry;
  const cy1 = (-factor * ry * x1) / rx;
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!arc.sweep && delta > 0) delta -= 2 * Math.PI;
  if (arc.sweep && delta < 0) delta += 2 * Math.PI;
  const cx = cos * cx1 - sin * cy1 + (from.x + to.x) / 2;
  const cy = sin * cx1 + cos * cy1 + (from.y + to.y) / 2;
  return polylineLength((t) => {
    const theta = start + delta * t;
    const ex = rx * Math.cos(theta);
    const ey = ry * Math.sin(theta);
    return { x: cos * ex - sin * ey + cx, y: sin * ex + cos * ey + cy };
  });
}

/**
 * Total length of path data in its own user units, like `SVGPathElement.getTotalLength()`
 * but without a DOM. Returns null for data that doesn't parse.
 */
export function pathLength(d: string): number | null {
  try {
    const commands = makeAbsolute(parseSVG(d));
    let length = 0;
    // The previous segment's last control point, for the reflected control point of S and T.
    let control: Point | null = null;
    let previousCode = "";
    for (const command of commands) {
      const from = { x: command.x0, y: command.y0 };
      const to = { x: command.x, y: command.y };
      let nextControl: Point | null = null;
      switch (command.code) {
        case "M":
          break;
        case "L":
        case "H":
        case "V":
        case "Z":
          length += Math.hypot(to.x - from.x, to.y - from.y);
          break;
        case "C":
          nextControl = { x: command.x2, y: command.y2 };
          length += cubicLength(from, { x: command.x1, y: command.y1 }, nextControl, to);
          break;
        case "S": {
          const first =
            control && (previousCode === "C" || previousCode === "S")
              ? { x: 2 * from.x - control.x, y: 2 * from.y - control.y }
              : from;
          nextControl = { x: command.x2, y: command.y2 };
          length += cubicLength(from, first, nextControl, to);
          break;
        }
        case "Q":
          nextControl = { x: command.x1, y: command.y1 };
          length += quadraticLength(from, nextControl, to);
          break;
        case "T":
          nextControl =
            control && (previousCode === "Q" || previousCode === "T")
              ? { x: 2 * from.x - control.x, y: 2 * from.y - control.y }
              : from;
          length += quadraticLength(from, nextControl, to);
          break;
        case "A":
          length += arcLength(from, to, {
            rx: command.rx,
            ry: command.ry,
            rotation: command.xAxisRotation,
            largeArc: command.largeArc,
            sweep: command.sweep,
          });
          break;
      }
      control = nextControl;
      previousCode = command.code;
    }
    return Number.isFinite(length) ? length : null;
  } catch {
    return null;
  }
}

/** A plain number (or px) attribute; null for percentages and other viewport-relative units. */
function lengthValue(raw: string | undefined, fallback = 0): number | null {
  if (raw === undefined) return fallback;
  if (!/^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?(px)?\s*$/i.test(raw)) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function pointsLength(points: string, closed: boolean): number | null {
  const values = points
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (values.some((value) => !Number.isFinite(value))) return null;
  let length = 0;
  for (let i = 2; i + 1 < values.length; i += 2) {
    length += Math.hypot(values[i]! - values[i - 2]!, values[i + 1]! - values[i - 1]!);
  }
  if (closed && values.length >= 4) {
    length += Math.hypot(values[0]! - values[values.length - 2]!, values[1]! - values[values.length - 1]!);
  }
  return length;
}

/** Perimeter of an ellipse (Ramanujan's second approximation). */
function ellipsePerimeter(rx: number, ry: number): number {
  const h = ((rx - ry) * (rx - ry)) / ((rx + ry) * (rx + ry) || 1);
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/**
 * Outline length of a basic shape element (path, rect, circle, ellipse, line, polyline or
 * polygon) from its attributes, in its own user units. Null for other elements and for sizes
 * that depend on the viewport.
 */
export function shapeLength(name: string, attributes: Record<string, string>): number | null {
  const n = (key: string) => lengthValue(attributes[key]);
  switch (name) {
    case "path":
      return attributes.d ? pathLength(attributes.d) : null;
    case "line": {
      const [x1, y1, x2, y2] = [n("x1"), n("y1"), n("x2"), n("y2")];
      if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
      return Math.hypot(x2 - x1, y2 - y1);
    }
    case "circle": {
      const r = n("r");
      return r === null ? null : 2 * Math.PI * r;
    }
    case "ellipse": {
      const rx = n("rx");
      const ry = n("ry");
      return rx === null || ry === null ? null : ellipsePerimeter(rx, ry);
    }
    case "rect": {
      const width = n("width");
      const height = n("height");
      if (width === null || height === null) return null;
      // A missing rx or ry takes the other's value, and both are capped at half the side.
      const rx = lengthValue(attributes.rx ?? attributes.ry);
      const ry = lengthValue(attributes.ry ?? attributes.rx);
      if (rx === null || ry === null) return null;
      const cornerX = Math.min(width / 2, Math.max(0, rx));
      const cornerY = Math.min(height / 2, Math.max(0, ry));
      const corners = cornerX > 0 && cornerY > 0 ? ellipsePerimeter(cornerX, cornerY) : 0;
      const straight =
        cornerX > 0 && cornerY > 0 ? 2 * (width - 2 * cornerX) + 2 * (height - 2 * cornerY) : 2 * (width + height);
      return straight + corners;
    }
    case "polyline":
      return attributes.points ? pointsLength(attributes.points, false) : null;
    case "polygon":
      return attributes.points ? pointsLength(attributes.points, true) : null;
    default:
      return null;
  }
}
