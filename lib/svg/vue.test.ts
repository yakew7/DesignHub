import { describe, expect, test } from "vitest";

import { parseSvg } from "@/lib/svg/parse";
import { vueComponent } from "@/lib/svg/vue";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <style>.a { fill: red; }</style>
  <defs><path id="p" d="M0 0h4"/></defs>
  <path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" @click="steal()"/>
  <use xlink:href="#p"/>
  <text x="2" y="20">{{ secret }} &amp; more</text>
</svg>`;

describe("SVG to Vue", () => {
  const code = vueComponent(tree(source), "my-icon.svg");

  test("is a Vue 3 single-file component named after the file", () => {
    expect(code.startsWith('<script setup lang="ts">\ndefineOptions({ name: "MyIcon", inheritAttrs: false });')).toBe(
      true,
    );
    expect(code).toContain("defineProps<{");
    expect(code).toMatch(/\n<template>\n {2}<svg [^\n]*>\n[\s\S]*\n {2}<\/svg>\n<\/template>\n/);
    expect(code).toContain('<title v-if="title">{{ title }}</title>');
  });

  test("keeps attributes in their SVG spelling", () => {
    expect(code).toContain(
      '<path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" />',
    );
    expect(code).toContain('<use xlink:href="#p" />');
    expect(code).not.toMatch(/strokeWidth|className|xlinkHref/);
  });

  test("sizes the root with 1em and passes $attrs through", () => {
    expect(code).toContain(
      ' viewBox="0 0 24 24" width="1em" height="1em" :role="title ? \'img\' : undefined" :aria-hidden="title ? undefined : \'true\'" v-bind="$attrs">',
    );
    expect(code).not.toContain('width="24"');
    expect(code).not.toContain('aria-hidden="true"');
  });

  test("moves <style> into a scoped block and never emits directives or interpolation", () => {
    expect(code).toContain("\n<style scoped>\n.a { fill: red; }\n</style>\n");
    expect(code.match(/<style/g)).toHaveLength(1);
    expect(code).not.toContain("@click");
    expect(code).toContain('<text x="2" y="20">{&#123; secret }} &amp; more</text>');
  });
});
