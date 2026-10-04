import { describe, expect, test } from "vitest";

import { componentName, iconExports } from "@/lib/icons/export";
import { defaultIconStyle } from "@/lib/icons/svg";

const icon = {
  body: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 12h16"/>',
  width: 24,
  height: 24,
};

describe("icon exports", () => {
  test("Vue component keeps SVG attributes and passes $attrs to the svg", () => {
    const vue = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "vue");
    expect(vue?.filename).toBe(`${componentName("tabler:brand-github")}.vue`);
    expect(vue?.code).toContain('defineOptions({ name: "BrandGithubIcon", inheritAttrs: false });');
    expect(vue?.code).toContain('<script setup lang="ts">');
    expect(vue?.code).toMatch(/<template>\n {2}<svg [^>]*v-bind="\$attrs">/);
    expect(vue?.code).toContain('stroke-width="2"');
    expect(vue?.code).not.toContain("strokeWidth");
  });

  test("Svelte component spreads rest props onto the svg and keeps SVG attributes", () => {
    const svelte = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "svelte");
    expect(svelte?.filename).toBe("BrandGithubIcon.svelte");
    expect(svelte?.language).toBe("svelte");
    expect(svelte?.code).toContain('<script lang="ts">');
    expect(svelte?.code).toContain("let { ...rest }: SVGAttributes<SVGSVGElement> = $props();");
    expect(svelte?.code).toMatch(/\n<svg [^>]*width="1em" height="1em"[^>]*\{\.\.\.rest\}>\n/);
    expect(svelte?.code).toContain('stroke-width="2"');
    expect(svelte?.code).not.toContain("strokeWidth");
  });

  test("Svelte component escapes braces so they aren't read as expressions", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/>" };
    const svelte = iconExports("tabler:brand-github", styled, defaultIconStyle).find(
      (format) => format.id === "svelte",
    );
    expect(svelte?.code).toContain(".a&#123;fill:red&#125;");
  });
});
