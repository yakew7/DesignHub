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

  test("Angular standalone component binds size and color inputs on the svg", () => {
    const angular = iconExports("tabler:brand-github", icon, { ...defaultIconStyle, color: "#ef4444" }).find(
      (format) => format.id === "angular",
    );
    expect(angular?.filename).toBe("brand-github-icon.component.ts");
    expect(angular?.language).toBe("ts");
    expect(angular?.code).toContain('selector: "brand-github-icon",');
    expect(angular?.code).toContain("standalone: true,");
    expect(angular?.code).toMatch(
      /<svg [^>]*\[attr\.width\]="size" \[attr\.height\]="size"[^>]*\[style\.color\]="color">/,
    );
    expect(angular?.code).toContain("export class BrandGithubIconComponent {");
    expect(angular?.code).toContain('@Input() size: string | number = "1em";');
    expect(angular?.code).toContain('@Input() color = "#ef4444";');
    // The body keeps currentColor so the color input can recolor it.
    expect(angular?.code).toContain('stroke="currentColor"');
    expect(angular?.code).toContain('stroke-width="2"');
  });

  test("Angular component escapes template syntax and template literal characters", () => {
    const tricky = { ...icon, body: "<style>@media print{.a{fill:red}}</style><text>`${x}` \\ {{ y }}</text>" };
    const angular = iconExports("tabler:brand-github", tricky, defaultIconStyle).find(
      (format) => format.id === "angular",
    );
    expect(angular?.code).toContain("<g ngNonBindable>");
    // <style> is raw text in Angular templates, so its CSS is left as written.
    expect(angular?.code).toContain("<style>@media print{.a{fill:red}}</style>");
    expect(angular?.code).toContain("<text>\\`\\$&#123;x&#125;\\` \\\\ &#123;&#123; y &#125;&#125;</text>");
  });

  test("Solid component spreads props onto the svg and keeps SVG attributes", () => {
    const solid = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "solid");
    expect(solid?.label).toBe("Solid");
    expect(solid?.filename).toBe("BrandGithubIcon.tsx");
    expect(solid?.language).toBe("tsx");
    expect(solid?.code).toContain('import type { JSX } from "solid-js";');
    expect(solid?.code).toContain("export function BrandGithubIcon(props: JSX.SvgSVGAttributes<SVGSVGElement>) {");
    expect(solid?.code).toMatch(/<svg [^>]*width="1em" height="1em"[^>]*\{\.\.\.props\}>/);
    expect(solid?.code).toContain('stroke-width="2"');
    expect(solid?.code).not.toContain("strokeWidth");
    expect(solid?.code).not.toContain("className");
  });

  test("Solid component escapes braces so JSX doesn't read them as expressions", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/><use xlink:href='#p'/>" };
    const solid = iconExports("tabler:brand-github", styled, defaultIconStyle).find((format) => format.id === "solid");
    expect(solid?.code).toContain(".a&#123;fill:red&#125;");
    expect(solid?.code).toContain("class='a'");
    expect(solid?.code).toContain("<use href='#p'/>");
  });

  test("Qwik component uses component$ and spreads props onto the svg", () => {
    const qwik = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "qwik");
    expect(qwik?.label).toBe("Qwik");
    expect(qwik?.filename).toBe("BrandGithubIcon.tsx");
    expect(qwik?.language).toBe("tsx");
    expect(qwik?.code).toContain('import { component$, type PropsOf } from "@builder.io/qwik";');
    expect(qwik?.code).toContain('export const BrandGithubIcon = component$((props: PropsOf<"svg">) => {');
    expect(qwik?.code).toMatch(/<svg [^>]*width="1em" height="1em"[^>]*\{\.\.\.props\}>/);
    expect(qwik?.code).toContain('stroke-width="2"');
    expect(qwik?.code).not.toContain("className");
    expect(qwik?.code.trimEnd().endsWith("});")).toBe(true);
  });

  test("Lit component defines size and color properties and renders the body with svg", () => {
    const lit = iconExports("tabler:brand-github", icon, { ...defaultIconStyle, color: "#ef4444" }).find(
      (format) => format.id === "lit",
    );
    expect(lit?.label).toBe("Lit");
    expect(lit?.filename).toBe("brand-github-icon.ts");
    expect(lit?.language).toBe("ts");
    expect(lit?.code).toContain('import { LitElement, html, svg } from "lit";');
    expect(lit?.code).toContain("export class BrandGithubIcon extends LitElement {");
    expect(lit?.code).toContain("size: { type: String },");
    expect(lit?.code).toContain('this.size = "1em";');
    expect(lit?.code).toContain('this.color = "#ef4444";');
    expect(lit?.code).toContain('customElements.define("brand-github-icon", BrandGithubIcon);');
    expect(lit?.code).toMatch(/width=\$\{this\.size\} height=\$\{this\.size\}/);
    expect(lit?.code).toContain('style="color: ${this.color}"');
    expect(lit?.code).toContain("${svg`");
    // The body keeps currentColor so the color property can recolor it.
    expect(lit?.code).toContain('stroke="currentColor"');
    expect(lit?.code).toContain('stroke-width="2"');
  });

  test("Lit component escapes backticks, backslashes and ${ in the artwork", () => {
    const tricky = { ...icon, body: "<text>`${x}` \\ done</text><path d='M0 0h24'/>" };
    const lit = iconExports("tabler:brand-github", tricky, defaultIconStyle).find((format) => format.id === "lit");
    expect(lit?.code).toContain("<text>\\`\\${x}\\` \\\\ done</text>");
    expect(lit?.code).not.toMatch(/[^\\]`\$\{x\}/);
  });

  test("React Native component uses react-native-svg elements and spreads props on the Svg", () => {
    const native = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "native");
    expect(native?.label).toBe("React Native");
    expect(native?.filename).toBe("BrandGithubIcon.native.tsx");
    expect(native?.language).toBe("tsx");
    expect(native?.code).toContain('import type { SvgProps } from "react-native-svg";');
    expect(native?.code).toContain('import Svg, { G, Path } from "react-native-svg";');
    expect(native?.code).toContain("export function BrandGithubIcon(props: SvgProps) {");
    expect(native?.code).toMatch(/<Svg [^>]*viewBox="0 0 1000 1000"[^>]*\{\.\.\.props\}>/);
    expect(native?.code).toContain('strokeWidth="2"');
    expect(native?.code).toContain('stroke="currentColor"');
    expect(native?.code).not.toMatch(/<(svg|path|g)[ >]/);
    expect(native?.code).not.toContain("xmlns");
  });

  test("React Native component for an icon with a gradient keeps the gradient stops", () => {
    const gradient = {
      ...icon,
      body: '<defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient></defs><path fill="url(#g)" d="M0 0h24v24H0z"/>',
    };
    const native = iconExports("tabler:brand-github", gradient, defaultIconStyle).find(
      (format) => format.id === "native",
    );
    expect(native?.code).toContain("LinearGradient");
    expect(native?.code).toContain("stopColor");
  });

  test("React Native component notes the <style> rules it drops", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/>" };
    const native = iconExports("tabler:brand-github", styled, defaultIconStyle).find(
      (format) => format.id === "native",
    );
    expect(native?.code).toContain("// Note: <style> isn't supported");
    expect(native?.code).not.toContain("fill:red");
  });

  test("Astro component reads size and color from Astro.props and spreads the rest on the svg", () => {
    const astro = iconExports("tabler:brand-github", icon, { ...defaultIconStyle, color: "#ef4444" }).find(
      (format) => format.id === "astro",
    );
    expect(astro?.label).toBe("Astro");
    expect(astro?.filename).toBe("BrandGithubIcon.astro");
    expect(astro?.code.startsWith("---\n")).toBe(true);
    expect(astro?.code).toContain('const { size = "1em", color = "#ef4444", ...rest } = Astro.props;');
    expect(astro?.code).toMatch(/<svg [^>]*width=\{size\} height=\{size\}[^>]*\{\.\.\.rest\}>/);
    // The body keeps currentColor so the color prop can recolor it.
    expect(astro?.code).toContain('stroke="currentColor"');
    expect(astro?.code).toContain('stroke-width="2"');
  });

  test("Astro component escapes braces in the body and keeps style CSS inline", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><text>{x}</text><path class='a' d='M0 0h24'/>" };
    const astro = iconExports("tabler:brand-github", styled, defaultIconStyle).find((format) => format.id === "astro");
    expect(astro?.code).toContain("<style is:inline>.a{fill:red}</style>");
    expect(astro?.code).toContain("<text>&#123;x&#125;</text>");
  });

  test("Qwik component escapes braces and rewrites xlink:href", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/><use xlink:href='#p'/>" };
    const qwik = iconExports("tabler:brand-github", styled, defaultIconStyle).find((format) => format.id === "qwik");
    expect(qwik?.code).toContain(".a&#123;fill:red&#125;");
    expect(qwik?.code).toContain("<use href='#p'/>");
    expect(qwik?.code).not.toContain("xlink:");
  });
  test("HTML export is an inline svg with role img, an aria-label from the icon name and currentColor", () => {
    const html = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "html");
    expect(html?.label).toBe("HTML");
    expect(html?.filename).toBe("brand-github.html");
    expect(html?.language).toBe("html");
    expect(html?.code).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1em" height="1em" viewBox="0 0 1000 1000" role="img" aria-label="Brand github">/,
    );
    expect(html?.code).not.toContain("aria-hidden");
    expect(html?.code).toContain('stroke="currentColor"');
    expect(html?.code).toContain('stroke-width="2"');
    expect(html?.code.trimEnd().endsWith("</svg>")).toBe(true);
  });

  test("decorative HTML export is hidden from assistive technology and has no role or label", () => {
    const html = iconExports("tabler:brand-github", icon, defaultIconStyle).find(
      (format) => format.id === "html-decorative",
    );
    expect(html?.label).toBe("HTML (decorative)");
    expect(html?.filename).toBe("brand-github.decorative.html");
    expect(html?.language).toBe("html");
    expect(html?.code).toMatch(/^<svg [^>]*viewBox="0 0 1000 1000" aria-hidden="true">/);
    expect(html?.code).not.toMatch(/role=|aria-label=/);
    expect(html?.code).toContain('stroke="currentColor"');
  });

  test("HTML export keeps the chosen color and escapes the icon name in the label", () => {
    const html = iconExports('x:a"b<c&d_e', icon, { ...defaultIconStyle, color: "#ef4444" });
    const code = html.find((format) => format.id === "html")?.code;
    expect(code).toContain('aria-label="A&quot;b&lt;c&amp;d e"');
    expect(code).toContain('stroke="#ef4444"');
    expect(code).not.toContain("currentColor");
  });

  test("HTML export gives each use of an id its own copy so two icons on a page don't clash", () => {
    const gradient = { ...icon, body: '<defs><linearGradient id="g"/></defs><path fill="url(#g)" d="M0 0h24v24H0z"/>' };
    const first = iconExports("tabler:brand-github", gradient, defaultIconStyle).find((format) => format.id === "html");
    const second = iconExports("tabler:brand-github", gradient, defaultIconStyle).find(
      (format) => format.id === "html",
    );
    const idOf = (code?: string) => /id="([^"]+)"/.exec(code ?? "")?.[1];
    expect(idOf(first?.code)).toBeDefined();
    expect(idOf(first?.code)).not.toBe("g");
    expect(idOf(first?.code)).not.toBe(idOf(second?.code));
  });
});
