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
});
