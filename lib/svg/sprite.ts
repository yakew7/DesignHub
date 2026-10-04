import { readViewBox } from "@/lib/svg/edit";
import { defaultOptimizeOptions, optimizeTree } from "@/lib/svg/optimize";
import { parseSvg } from "@/lib/svg/parse";
import { minify, prettyPrint } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

export type SpriteItem = { id: string; source: string };

export function symbolId(fileName: string): string {
  const slug = fileName
    .replace(/\.svg$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return /^[a-z]/.test(slug) ? slug : `icon-${slug || "svg"}`;
}

/** `symbolId(name)`, with `-2`, `-3`... appended until it isn't one of `taken`. */
export function uniqueSymbolId(name: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = symbolId(name);
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

/**
 * Prefixes every internal id (and its references) so symbols can't clash inside one sprite.
 * The "_" separator never appears in a symbol id, so "a" + "b-c" and "a-b" + "c" stay distinct
 * and no internal id can equal a symbol id.
 */
function namespaceIds(node: SvgNode, prefix: string): void {
  const renameUrls = (value: string) => value.replace(/url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g, `url(#${prefix}_$2)`);
  const visit = (current: SvgNode) => {
    for (const [name, value] of Object.entries(current.attributes)) {
      if (name === "id") current.attributes[name] = `${prefix}_${value}`;
      // A bare "#id" is only a reference in href attributes; elsewhere "#fbbf24" is a color.
      else if ((name === "href" || name === "xlink:href") && value.startsWith("#"))
        current.attributes[name] = `#${prefix}_${value.slice(1)}`;
      else if (value.includes("url(")) current.attributes[name] = renameUrls(value);
    }
    current.children.forEach(visit);
  };
  node.children.forEach(visit);
}

const INHERITED = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule"];

function toSymbol(item: SpriteItem): SvgNode | null {
  const parsed = parseSvg(item.source);
  if (!parsed.ok) return null;
  const tree = optimizeTree(parsed.root, { ...defaultOptimizeOptions, removeUnusedIds: false });
  namespaceIds(tree, item.id);
  const box = readViewBox(tree);
  const width = Number.parseFloat(tree.attributes.width ?? "") || 24;
  const height = Number.parseFloat(tree.attributes.height ?? "") || 24;
  const attributes: Record<string, string> = {
    id: item.id,
    viewBox: box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 0 ${width} ${height}`,
  };
  // Paint set on the original <svg> would otherwise be lost when it becomes a <symbol>.
  for (const name of INHERITED) if (tree.attributes[name]) attributes[name] = tree.attributes[name]!;
  return { name: "symbol", type: "element", value: "", attributes, children: tree.children };
}

export function buildSprite(items: SpriteItem[], pretty = true): string {
  const symbols = items.map(toSymbol).filter((symbol): symbol is SvgNode => symbol !== null);
  const sprite: SvgNode = {
    name: "svg",
    type: "element",
    value: "",
    // Not display:none - Chrome won't paint gradients defined inside a display:none sprite.
    attributes: {
      xmlns: "http://www.w3.org/2000/svg",
      width: "0",
      height: "0",
      style: "position:absolute;overflow:hidden",
      "aria-hidden": "true",
    },
    children: symbols,
  };
  return pretty ? `${prettyPrint(sprite)}\n` : minify(sprite);
}

export function spriteUsage(items: SpriteItem[]): string {
  const first = items[0]?.id ?? "icon";
  return `<!-- 1. Inline the sprite once (e.g. right after <body>), or serve it as /sprite.svg -->

<!-- 2. Use any symbol -->
<svg width="24" height="24" aria-hidden="true">
  <use href="#${first}" />
</svg>

<!-- From an external file (same origin) -->
<svg width="24" height="24" aria-hidden="true">
  <use href="/sprite.svg#${first}" />
</svg>

<!-- React -->
<svg width={24} height={24} aria-hidden="true"><use href="/sprite.svg#${first}" /></svg>

<!-- Symbols: ${items.map((item) => item.id).join(", ")} -->
`;
}
