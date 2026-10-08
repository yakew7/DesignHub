import { componentNameFromFile } from "@/lib/svg/jsx";
import { escapeAttribute } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

/**
 * Braces open control flow blocks and "{{" interpolation, and @ starts a block (@if, @for), anywhere
 * in an Angular template, so they are written as entities. <style> is raw text and is left alone.
 */
export const escapeAngularText = (value: string) =>
  value.replace(/[{}@]/g, (char) => (char === "{" ? "&#123;" : char === "}" ? "&#125;" : "&#64;"));

/** Escapes backslashes, backticks and $ so a template or style survives inside a TS template literal. */
export const escapeTemplateLiteral = (value: string) => value.replace(/[\\`$]/g, (char) => `\\${char}`);

/**
 * Attribute names Angular would read as bindings, events, references or structural directives
 * ([x], (x), *x, #x, bind-x, on-x), plus inline event handlers (onclick and friends).
 */
const BINDING = /^(?:on|[[(*#]|bind-|bindon-|let-|ref-|i18n)/i;

/** Elements a template shouldn't hold: <style> moves to the component styles, <script> is dropped. */
const HOISTED = new Set(["style", "script"]);

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .filter(([name]) => !BINDING.test(name))
    .map(([name, value]) => ` ${name}="${escapeAngularText(escapeAttribute(value))}"`)
    .join("");
}

/** svgson keeps text escaped, so only template syntax needs encoding. */
const text = (node: SvgNode) => escapeAngularText(node.value);

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

function markup(node: SvgNode, depth: number): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return `${pad}${text(node).trim()}`;
  const open = `${pad}<${node.name}${attributes(node)}`;
  const children = visible(node);
  if (children.length === 0) return `${open} />`;
  // Elements with text content stay on one line so whitespace isn't altered.
  if (children.some((child) => child.type === "text"))
    return `${open}>${children.map((child) => (child.type === "text" ? text(child) : inline(child))).join("")}</${node.name}>`;
  return `${open}>\n${children.map((child) => markup(child, depth + 1)).join("\n")}\n${pad}</${node.name}>`;
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

/** "ArrowRight" → "arrow-right". */
export function kebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Angular standalone component with `size` and `title` inputs. Attributes keep their SVG spelling.
 * The artwork sits in an ngNonBindable group so nothing in it is bound or interpolated, and braces
 * and @ are written as entities so they don't open control flow blocks. Any <style> moves to the
 * component's (encapsulated) styles.
 */
export function angularComponent(root: SvgNode, fileName: string): string {
  const name = componentNameFromFile(fileName);
  const selector = `svg-${kebabCase(name)}`;
  const tree = structuredClone(root);
  for (const attribute of ["width", "height", "role", "aria-hidden"]) delete tree.attributes[attribute];
  const css: string[] = [];
  collectStyles(tree, css);
  const body = visible(tree)
    .map((child) => markup(child, 4))
    .join("\n");
  const open = `<svg${attributes(tree)} [attr.width]="size" [attr.height]="size" [attr.role]="title ? 'img' : null" [attr.aria-hidden]="title ? null : 'true'">`;
  const template = [
    `    ${open}`,
    "      @if (title) {",
    "        <title>{{ title }}</title>",
    "      }",
    ...(body ? ["      <g ngNonBindable>", body, "      </g>"] : []),
    "    </svg>",
  ].join("\n");
  const blocks = css.filter(Boolean);
  const styles = blocks.length
    ? `\n  styles: \`\n${escapeTemplateLiteral(blocks.join("\n"))
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n")}\n  \`,`
    : "";

  return `import { Component, Input } from "@angular/core";

@Component({
  selector: "${selector}",
  standalone: true,
  template: \`
${escapeTemplateLiteral(template)}
  \`,${styles}
})
export class ${name}Component {
  /** Width and height. The default follows the surrounding font size. */
  @Input() size: string | number = "1em";
  /** Accessible name. Without it the SVG is treated as decorative. */
  @Input() title?: string;
}
`;
}
