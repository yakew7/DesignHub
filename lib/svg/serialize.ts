import type { SvgNode } from "@/types/svg";

export const escapeAttribute = (value: string) =>
  value
    .replace(/&(?!(?:[a-z]+|#\d+|#x[\da-f]+);)/gi, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
}

/** svgson keeps text values in their source (already escaped) form, so they are written back verbatim. */
function text(node: SvgNode): string {
  return node.value;
}

export function minify(node: SvgNode): string {
  if (node.type === "text") return text(node).trim();
  const children = node.children.map(minify).join("");
  return children
    ? `<${node.name}${attributes(node)}>${children}</${node.name}>`
    : `<${node.name}${attributes(node)}/>`;
}

/** Indented markup. Elements with text content stay on one line so whitespace isn't altered. */
export function prettyPrint(node: SvgNode, depth = 0, indent = "  "): string {
  const pad = indent.repeat(depth);
  if (node.type === "text") return `${pad}${text(node).trim()}`;
  const open = `${pad}<${node.name}${attributes(node)}`;
  if (node.children.length === 0) return `${open}/>`;
  if (node.children.some((child) => child.type === "text")) {
    return `${open}>${node.children.map((child) => (child.type === "text" ? text(child) : minify(child))).join("")}</${node.name}>`;
  }
  const children = node.children.map((child) => prettyPrint(child, depth + 1, indent)).join("\n");
  return `${open}>\n${children}\n${pad}</${node.name}>`;
}
