import { describe, expect, test } from "vitest";

import { angularComponent } from "@/lib/svg/angular";
import { parseSvg } from "@/lib/svg/parse";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <style>@media print { .a { fill: red; } } .b::after { content: "\`\${x}\`"; }</style>
  <defs><path id="p" d="M0 0h4"/></defs>
  <path class="a" stroke-width="2" fill-rule="evenodd" d="M4 12h16" onclick="steal()" (click)="steal()" [attr.x]="y" #ref/>
  <use xlink:href="#p" data-note="{{ oops }}"/>
  <text x="2" y="20">{{ secret }} @if (x) { \` \${y} \\ }</text>
</svg>`;

describe("SVG to Angular", () => {
  const code = angularComponent(tree(source), "arrow-right.svg");

  test("is a standalone component with size and title inputs", () => {
    expect(code.startsWith('import { Component, Input } from "@angular/core";')).toBe(true);
    expect(code).toContain('selector: "svg-arrow-right",');
    expect(code).toContain("standalone: true,");
    expect(code).toContain("export class ArrowRightComponent {");
    expect(code).toContain('@Input() size: string | number = "1em";');
    expect(code).toContain("@Input() title?: string;");
    expect(code).toContain(
      ` viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" [attr.role]="title ? 'img' : null" [attr.aria-hidden]="title ? null : 'true'">`,
    );
    expect(code).toContain("      @if (title) {\n        <title>{{ title }}</title>\n      }");
    expect(code).not.toContain('width="24"');
    expect(code).not.toContain('aria-hidden="true"');
  });

  test("keeps attributes in their SVG spelling inside an ngNonBindable group", () => {
    expect(code).toContain("      <g ngNonBindable>\n");
    expect(code).toContain('<path class="a" stroke-width="2" fill-rule="evenodd" d="M4 12h16" />');
    expect(code).toContain('<use xlink:href="#p"');
    expect(code).not.toMatch(/strokeWidth|className|xlinkHref/);
  });

  test("escapes braces, @ and template literal characters and drops bindings", () => {
    expect(code).toContain('data-note="&#123;&#123; oops &#125;&#125;"');
    expect(code).toContain(
      '<text x="2" y="20">&#123;&#123; secret &#125;&#125; &#64;if (x) &#123; \\` \\$&#123;y&#125; \\\\ &#125;</text>',
    );
    expect(code).not.toMatch(/onclick|\(click\)|\[attr\.x\]|#ref|steal/);
  });

  test("moves <style> into the component styles", () => {
    expect(code).toContain(
      '  styles: `\n    @media print { .a { fill: red; } } .b::after { content: "\\`\\${x}\\`"; }\n  `,',
    );
    expect(code.match(/<style/g)).toBeNull();
  });

  test("leaves out the group and styles for an empty SVG", () => {
    const empty = angularComponent(tree('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>'), "1.svg");
    expect(empty).toContain("export class Svg1Component {");
    expect(empty).toContain('selector: "svg-svg1",');
    expect(empty).not.toContain("ngNonBindable");
    expect(empty).not.toContain("styles:");
  });
});
