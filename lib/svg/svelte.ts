import { escapeAttribute } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

/**
 * Attribute names Svelte would read as directives (bind:, on:, use:, class:x, ...) or event handlers
 * (onclick and friends are expressions in Svelte 5, not strings).
 */
const DIRECTIVE = /^(?:on|(?:bind|use|class|style|let|transition|in|out|animate):)/i;

/** Elements Svelte markup can't hold: <style> moves to the component style block, <script> is dropped. */
const HOISTED = new Set(["style", "script"]);

/** Braces start an expression anywhere in Svelte markup, so they are written as entities. */
const braces = (value: string) => value.replace(/[{}]/g, (brace) => (brace === "{" ? "&#123;" : "&#125;"));

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .filter(([name]) => !DIRECTIVE.test(name))
    .map(([name, value]) => ` ${name}="${braces(escapeAttribute(value))}"`)
    .join("");
}

/** svgson keeps text escaped, so only braces need encoding. */
const text = (node: SvgNode) => braces(node.value);

function visible(node: SvgNode): SvgNode[] {
  return node.children.filter((child) => !(child.type === "element" && HOISTED.has(child.name)));
}

function inline(node: SvgNode): string {
  if (node.type === "text") return text(node).trim();
  const children = visible(node).map(inline).join("");
  return children
    ? `<${node.name}${attributes(node)}>${children}</${node.name}>`
    : `<${node.name}${attributes(node)} />`;
}

function markup(node: SvgNode, depth: number, extra = "", prefix: string[] = []): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return `${pad}${text(node).trim()}`;
  const open = `${pad}<${node.name}${attributes(node)}${extra}`;
  const children = visible(node);
  if (children.length === 0 && prefix.length === 0) return `${open} />`;
  // Elements with text content stay on one line so whitespace isn't altered.
  if (children.some((child) => child.type === "text"))
    return `${open}>${children.map((child) => (child.type === "text" ? text(child) : inline(child))).join("")}</${node.name}>`;
  const lines = [...prefix.map((line) => `${pad}  ${line}`), ...children.map((child) => markup(child, depth + 1))];
  return `${open}>\n${lines.join("\n")}\n${pad}</${node.name}>`;
}

function collectStyles(node: SvgNode, css: string[]): void {
  node.children.forEach((child) => {
    if (child.type !== "element") return;
    if (child.name === "style")
      css.push(
        child.children
          .map((item) => item.value)
          .join("")
          .trim(),
      );
    else collectStyles(child, css);
  });
}

/**
 * Svelte 5 component. Attributes keep their SVG spelling, extra props such as class and style are
 * spread onto the <svg>, and an optional `title` prop gives the icon an accessible name. Any
 * <style> moves to the component's (scoped) style block.
 */
export function svelteComponent(root: SvgNode): string {
  const tree = structuredClone(root);
  for (const attribute of ["width", "height", "role", "aria-hidden"]) delete tree.attributes[attribute];
  tree.attributes = { ...tree.attributes, width: "1em", height: "1em" };
  const css: string[] = [];
  collectStyles(tree, css);
  const template = markup(
    tree,
    0,
    ` role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} {...rest}`,
    ["{#if title}<title>{title}</title>{/if}"],
  );
  const blocks = css.filter(Boolean);
  const style = blocks.length ? `\n<style>\n${blocks.join("\n")}\n</style>\n` : "";

  return `<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";

  /** title is the accessible name. Without it the SVG is treated as decorative. */
  let { title, ...rest }: SVGAttributes<SVGSVGElement> & { title?: string } = $props();
</script>

${template}
${style}`;
}
