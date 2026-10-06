import { describe, expect, test } from "vitest";

import { parseSvg } from "@/lib/svg/parse";
import { svelteComponent } from "@/lib/svg/svelte";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <style>.a { fill: red; }</style>
  <defs><path id="p" d="M0 0h4"/></defs>
  <path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" onclick="steal()" on:click="steal" bind:this="x"/>
  <use xlink:href="#p" data-note="{oops}"/>
  <text x="2" y="20">{secret} &amp; {@html more}</text>
</svg>`;

describe("SVG to Svelte", () => {
  const code = svelteComponent(tree(source));

  test("is a Svelte 5 component with rest props and an optional title", () => {
    expect(code.startsWith('<script lang="ts">\n  import type { SVGAttributes } from "svelte/elements";')).toBe(true);
    expect(code).toContain("let { title, ...rest }: SVGAttributes<SVGSVGElement> & { title?: string } = $props();");
    expect(code).toMatch(/\n<\/script>\n\n<svg [^\n]*>\n[\s\S]*\n<\/svg>\n/);
    expect(code).toContain("  {#if title}<title>{title}</title>{/if}");
  });

  test("keeps attributes in their SVG spelling", () => {
    expect(code).toContain(
      '<path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" />',
    );
    expect(code).toContain('<use xlink:href="#p"');
    expect(code).not.toMatch(/strokeWidth|className|xlinkHref/);
  });

  test("sizes the root with 1em and spreads extra props onto the svg", () => {
    expect(code).toContain(
      ' viewBox="0 0 24 24" width="1em" height="1em" role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} {...rest}>',
    );
    expect(code).not.toContain('width="24"');
    expect(code).not.toContain('aria-hidden="true"');
  });

  test("escapes braces in text and attributes and drops directives and event handlers", () => {
    expect(code).toContain('<text x="2" y="20">&#123;secret&#125; &amp; &#123;@html more&#125;</text>');
    expect(code).toContain('data-note="&#123;oops&#125;"');
    expect(code).not.toMatch(/onclick|on:click|bind:this|steal/);
  });

  test("moves <style> into the component style block", () => {
    expect(code).toMatch(/<\/svg>\n\n<style>\n\.a \{ fill: red; \}\n<\/style>\n$/);
    expect(code.match(/<style/g)).toHaveLength(1);
  });
});
