import { describe, expect, test } from "vitest";

import { parseSvg } from "@/lib/svg/parse";
import { preactComponent } from "@/lib/svg/preact";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const small = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M4 12h16"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <style>.a { fill: \`red\`; } \${x}</style>
  <defs><path id="p" d="M0 0h4"/></defs>
  <path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" onclick="steal()" on:click="x" key="k" ref="r" dangerouslySetInnerHTML="&lt;img&gt;"/>
  <use xlink:href="#p" data-note="{oops}"/>
  <text x="2" y="20">{secret} &amp; more</text>
  <script>steal()</script>
</svg>`;

describe("SVG to Preact", () => {
  test("is a function component named after the file with an optional title", () => {
    const code = preactComponent(tree(small), "my-icon.svg");
    expect(code.startsWith('import type { JSX } from "preact";\n')).toBe(true);
    expect(code).toContain('type MyIconProps = JSX.IntrinsicElements["svg"] & {');
    expect(code).toContain("export function MyIcon({ title, ...props }: MyIconProps) {");
    expect(code).toContain("      {title ? <title>{title}</title> : null}");
    expect(code).toMatch(/ {2}return \(\n {4}<svg [^\n]*>\n[\s\S]*\n {4}<\/svg>\n {2}\);\n\}\n$/);
  });

  test("converts a small SVG, sizes the root with 1em and spreads the other props onto it", () => {
    const code = preactComponent(tree(small), "my-icon.svg");
    expect(code).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="1em" height="1em" role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} {...props}>',
    );
    expect(code).toContain('<path d="M4 12h16" />');
    expect(code).toContain('<circle cx="12" cy="12" r="3" />');
    expect(code).not.toContain('width="24"');
  });

  test("keeps attributes in their SVG spelling and rewrites xlink:href to href", () => {
    const code = preactComponent(tree(source), "my-icon.svg");
    expect(code).toContain(
      '<path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" />',
    );
    expect(code).toContain('<use href="#p" data-note="{oops}" />');
    expect(code).not.toMatch(/strokeWidth|className|xlink/);
  });

  test("keeps a <style> block as a template literal and escapes braces in text", () => {
    const code = preactComponent(tree(source), "my-icon.svg");
    expect(code).toContain("<style>{`.a { fill: \\`red\\`; } \\${x}`}</style>");
    expect(code).toContain('<text x="2" y="20">&#123;secret&#125; &amp; more</text>');
  });

  test("drops scripts, event handlers, key, ref and raw HTML props", () => {
    const code = preactComponent(tree(source), "my-icon.svg");
    expect(code).not.toMatch(/onclick|on:click|\skey=|\sref=|dangerouslySetInnerHTML|<script|steal|xmlns:xlink/);
  });
});
