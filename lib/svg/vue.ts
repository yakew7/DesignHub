import { componentNameFromFile } from "@/lib/svg/jsx";
import { escapeAttribute } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

/** Attribute names Vue would read as directives or bindings (v-on, :x, @click, #slot). */
const DIRECTIVE = /^(?:v-|[:@#])/;

/** Elements a Vue template can't hold: <style> moves to the SFC style block, <script> is dropped. */
const HOISTED = new Set(["style", "script"]);

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .filter(([name]) => !DIRECTIVE.test(name))
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
}

/** svgson keeps text escaped; only "{{" needs encoding so Vue doesn't read it as interpolation. */
const text = (node: SvgNode) => node.value.replace(/\{\{/g, "{&#123;");

function inline(node: SvgNode): string {
  if (node.type === "text") return text(node).trim();
  const children = node.children
    .filter((child) => !(child.type === "element" && HOISTED.has(child.name)))
    .map(inline)
    .join("");
  return children
    ? `<${node.name}${attributes(node)}>${children}</${node.name}>`
    : `<${node.name}${attributes(node)} />`;
}

function markup(node: SvgNode, depth: number, extra = "", prefix: string[] = []): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return `${pad}${text(node).trim()}`;
  const open = `${pad}<${node.name}${attributes(node)}${extra}`;
  const children = node.children.filter((child) => !(child.type === "element" && HOISTED.has(child.name)));
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
 * Vue 3 single-file component. Attributes keep their SVG spelling (Vue templates need no
 * camelCase), extra attributes such as class and style land on the <svg> through $attrs, and an
 * optional `title` prop gives the icon an accessible name.
 */
export function vueComponent(root: SvgNode, fileName: string): string {
  const name = componentNameFromFile(fileName);
  const tree = structuredClone(root);
  for (const attribute of ["width", "height", "role", "aria-hidden"]) delete tree.attributes[attribute];
  tree.attributes = { ...tree.attributes, width: "1em", height: "1em" };
  const css: string[] = [];
  collectStyles(tree, css);
  const template = markup(
    tree,
    1,
    ` :role="title ? 'img' : undefined" :aria-hidden="title ? undefined : 'true'" v-bind="$attrs"`,
    ['<title v-if="title">{{ title }}</title>'],
  );
  const style = css.filter(Boolean).length ? `\n<style scoped>\n${css.filter(Boolean).join("\n")}\n</style>\n` : "";

  return `<script setup lang="ts">
defineOptions({ name: "${name}", inheritAttrs: false });

defineProps<{
  /** Accessible name. Without it the SVG is treated as decorative. */
  title?: string;
}>();
</script>

<template>
${template}
</template>
${style}`;
}
