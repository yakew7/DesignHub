import { shapeLength } from "@/lib/svg/inspect";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { parseSvg } from "@/lib/svg/parse";
import { minify } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

export type DrawOnOptions = {
  /** Replay forever (draw, hold, undraw) instead of playing once. */
  loop?: boolean;
};

/** Phase timings in seconds. Every element's animation shares them, offset by its stagger. */
const DRAW_END = 1.3;
const FILL_START = 0.9;
const FILL_END = 1.7;
const TRACE_END = 1.9;
const HOLD_END = 3.6;
const LOOP_END = 4.2;
/** The total stagger across all elements, and the most any one element waits for the previous. */
const STAGGER_TOTAL = 0.6;
const STAGGER_MAX = 0.12;
/** Width of the temporary outline traced around filled shapes, as a fraction of the viewBox. */
const TRACE_WIDTH = 0.012;

const SHAPES = new Set(["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"]);
const FADES = new Set(["text", "image", "use"]);
/** Containers whose children are referenced, not drawn where they stand. */
const NON_RENDERED = new Set([
  "defs",
  "clipPath",
  "mask",
  "pattern",
  "marker",
  "symbol",
  "linearGradient",
  "radialGradient",
  "filter",
  "style",
  "title",
  "desc",
  "metadata",
]);

type Inherited = { fill: string; fillOpacity: string; stroke: string; strokeWidth: string; scale: number };

/** A presentation property from the style attribute (which wins) or the attribute itself. */
function property(node: SvgNode, name: string): string | undefined {
  const style = node.attributes.style ?? "";
  for (const declaration of style.split(";")) {
    const [key, ...rest] = declaration.split(":");
    if (key?.trim().toLowerCase() === name && rest.length > 0) return rest.join(":").trim();
  }
  return node.attributes[name]?.trim();
}

const isNone = (paint: string) => /^(none|transparent)$/i.test(paint.trim());

/** Size of an <svg> element's coordinate system, for picking a trace width that reads at any scale. */
function viewBoxSize(node: SvgNode, fallback: number): number {
  const box = (node.attributes.viewBox ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (box.length === 4 && box.every(Number.isFinite)) return Math.max(box[2] ?? 0, box[3] ?? 0) || fallback;
  const width = Number.parseFloat(node.attributes.width ?? "");
  const height = Number.parseFloat(node.attributes.height ?? "");
  return Math.max(Number.isFinite(width) ? width : 0, Number.isFinite(height) ? height : 0) || fallback;
}

const round = (value: number) => Math.round(value * 100) / 100;

function addStyle(node: SvgNode, declarations: Record<string, string | number>) {
  const extra = Object.entries(declarations)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  const style = node.attributes.style?.trim().replace(/;$/, "");
  node.attributes.style = style ? `${style};${extra}` : extra;
}

function addClass(node: SvgNode, name: string) {
  node.attributes.class = node.attributes.class ? `${node.attributes.class} ${name}` : name;
}

type Animated = { node: SvgNode; kind: "draw" | "trace" | "fade" };

/** Tags drawable elements in document order and records what each one needs as CSS variables. */
function collect(node: SvgNode, inherited: Inherited, out: Animated[]): void {
  if (node.type !== "element" || NON_RENDERED.has(node.name)) return;
  if (property(node, "display") === "none") return;
  const scale = node.name === "svg" ? viewBoxSize(node, inherited.scale) : inherited.scale;
  const current: Inherited = {
    fill: property(node, "fill") ?? inherited.fill,
    fillOpacity: property(node, "fill-opacity") ?? inherited.fillOpacity,
    stroke: property(node, "stroke") ?? inherited.stroke,
    strokeWidth: property(node, "stroke-width") ?? inherited.strokeWidth,
    scale,
  };
  if (SHAPES.has(node.name)) {
    const length = shapeLength(node.name, node.attributes);
    const stroked = !isNone(current.stroke) && Number.parseFloat(current.strokeWidth) !== 0;
    const filled = !isNone(current.fill) && node.name !== "line" && node.name !== "polyline";
    if (length !== null && length > 0 && (stroked || filled)) {
      // A little over the measured length, so the dash always covers the whole outline.
      const dash = round(length * 1.02 + 1);
      addStyle(node, {
        "--dh-l": dash,
        "--dh-fo": current.fillOpacity,
        ...(stroked ? {} : { "--dh-c": current.fill, "--dh-w": round(scale * TRACE_WIDTH) }),
      });
      out.push({ node, kind: stroked ? "draw" : "trace" });
    } else if (filled || stroked) {
      addStyle(node, { "--dh-op": property(node, "opacity") ?? "1" });
      out.push({ node, kind: "fade" });
    }
    return;
  }
  if (FADES.has(node.name)) {
    addStyle(node, { "--dh-op": property(node, "opacity") ?? "1" });
    out.push({ node, kind: "fade" });
    return;
  }
  node.children.forEach((child) => collect(child, current, out));
}

/** Percent of the cycle at `seconds`. */
const at = (seconds: number, total: number) => `${round((seconds / total) * 100)}%`;

function stylesheet(loop: boolean): string {
  const total = loop ? LOOP_END : TRACE_END;
  // Keyframe selectors for these times, without repeating the same stop.
  const p = (...seconds: number[]) => [...new Set(seconds.map((value) => at(value, total)))].join(",");
  const dash = "stroke-dasharray:var(--dh-l)";
  const trace = `stroke:var(--dh-c);stroke-width:var(--dh-w);stroke-linejoin:round;stroke-linecap:round;${dash}`;
  // Looping holds the finished logo, then undraws it and fades the fills out before replaying.
  const draw = loop
    ? `0%{${dash};stroke-dashoffset:var(--dh-l)}${p(DRAW_END, HOLD_END)}{${dash};stroke-dashoffset:0}100%{${dash};stroke-dashoffset:var(--dh-l)}`
    : `0%{${dash};stroke-dashoffset:var(--dh-l)}${p(DRAW_END, total)}{${dash};stroke-dashoffset:0}`;
  const traced =
    `0%{${trace};stroke-dashoffset:var(--dh-l);stroke-opacity:1}` +
    `${p(DRAW_END, FILL_END)}{${trace};stroke-dashoffset:0;stroke-opacity:1}` +
    `${p(TRACE_END, total)}{${trace};stroke-dashoffset:0;stroke-opacity:0}`;
  const fade = (prop: string, variable: string) =>
    loop
      ? `${p(0, FILL_START)}{${prop}:0}${p(FILL_END, HOLD_END)}{${prop}:var(${variable})}100%{${prop}:0}`
      : `${p(0, FILL_START)}{${prop}:0}${p(FILL_END, total)}{${prop}:var(${variable})}`;
  return [
    `@keyframes dh-draw{${draw}}`,
    `@keyframes dh-trace{${traced}}`,
    `@keyframes dh-fill{${fade("fill-opacity", "--dh-fo")}}`,
    `@keyframes dh-fade{${fade("opacity", "--dh-op")}}`,
    `.dh-draw,.dh-trace,.dh-fade{animation-duration:${total}s;animation-timing-function:ease-in-out;animation-fill-mode:backwards;animation-iteration-count:${loop ? "infinite" : 1};animation-delay:var(--dh-delay,0s)}`,
    ".dh-draw{animation-name:dh-draw,dh-fill}",
    ".dh-trace{animation-name:dh-trace,dh-fill}",
    ".dh-fade{animation-name:dh-fade}",
    // Reduced motion, and any renderer without CSS animations, shows the finished logo.
    "@media (prefers-reduced-motion:reduce){.dh-draw,.dh-trace,.dh-fade{animation:none}}",
  ].join("");
}

/**
 * A draw-on version of an SVG logo: outlines trace in, measured per element for
 * `stroke-dasharray`, then fills fade in. Everything lives in a CSS `<style>`, and the markup
 * itself is untouched apart from classes and custom properties, so tools that ignore CSS (and
 * people who prefer reduced motion) see the finished logo. The source is sanitized first.
 * Returns null if the source isn't SVG.
 */
export function drawOnSvg(source: string, options: DrawOnOptions = {}): string | null {
  const clean = sanitizeSvg(source);
  if (!clean) return null;
  const parsed = parseSvg(clean);
  if (!parsed.ok) return null;
  const root = parsed.root;
  const animated: Animated[] = [];
  collect(
    root,
    { fill: "#000000", fillOpacity: "1", stroke: "none", strokeWidth: "1", scale: viewBoxSize(root, 100) },
    animated,
  );
  const step = animated.length > 1 ? Math.min(STAGGER_MAX, STAGGER_TOTAL / (animated.length - 1)) : 0;
  animated.forEach(({ node, kind }, index) => {
    addClass(node, `dh-${kind}`);
    if (index > 0) addStyle(node, { "--dh-delay": `${round(index * step)}s` });
  });
  const style: SvgNode = {
    name: "style",
    type: "element",
    value: "",
    attributes: {},
    children: [{ name: "", type: "text", value: stylesheet(options.loop ?? false), attributes: {}, children: [] }],
  };
  root.children.unshift(style);
  return minify(root);
}
