import { componentNameFromFile } from "@/lib/svg/jsx";
import { verbatimJsx } from "@/lib/svg/solid";
import type { SvgNode } from "@/types/svg";

/**
 * Preact function component. Preact sets SVG attributes as written, so they keep their SVG
 * spelling (class, stroke-width) apart from xlink:href, which becomes href, and the markup rules
 * (braces, scripts, event handlers, CSS in a template literal) are shared with the Solid and Qwik
 * converters. Extra props such as class and style are spread onto the <svg>, and an optional
 * `title` prop gives the icon an accessible name.
 */
export function preactComponent(root: SvgNode, fileName: string): string {
  const name = componentNameFromFile(fileName);
  const template = verbatimJsx(
    root,
    ` role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} {...props}`,
    ["{title ? <title>{title}</title> : null}"],
    2,
  );

  return `import type { JSX } from "preact";

type ${name}Props = JSX.IntrinsicElements["svg"] & {
  /** Accessible name. Without it the SVG is treated as decorative. */
  title?: string;
};

export function ${name}({ title, ...props }: ${name}Props) {
  return (
    ${template}
  );
}
`;
}
