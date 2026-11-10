import { componentNameFromFile, reactComponent, toJsx, withCurrentColor } from "@/lib/svg/jsx";
import { translateName } from "@/lib/i18n/dynamic-key";
import type { Translate } from "@/lib/i18n/translate";
import { angularComponent } from "@/lib/svg/angular";
import { frameworkFormat } from "@/lib/svg/converters";
import { astroComponent } from "@/lib/svg/astro";
import { svgBackgroundCss } from "@/lib/svg/data-uri";
import { litComponent } from "@/lib/svg/lit";
import type { OptimizeResult } from "@/lib/svg/optimize";
import { preactComponent } from "@/lib/svg/preact";
import { qwikComponent } from "@/lib/svg/qwik";
import type { NativeResult } from "@/lib/svg/react-native";
import { minify, prettyPrint } from "@/lib/svg/serialize";
import { solidComponent } from "@/lib/svg/solid";
import { buildSprite, spriteUsage } from "@/lib/svg/sprite";
import { svelteComponent } from "@/lib/svg/svelte";
import { vueComponent } from "@/lib/svg/vue";
import type { ExportFormat } from "@/types/export";
import type { SvgNode } from "@/types/svg";

export type SvgFormatInput = {
  root: SvgNode | null;
  optimized: OptimizeResult | null;
  /** The optimized tree. */
  tree: SvgNode | null;
  native: NativeResult | null;
  currentColor: boolean;
  /** The file name the person gave the SVG. */
  name: string;
  /** SVGs combined into a sprite, when there are any. */
  sprite: Parameters<typeof buildSprite>[0];
};

export function svgFormatName(t: Translate, format: { id: string; label: string }): string {
  return translateName(t, `svg.format.${format.id}`, format.label);
}

/** Every output of the SVG Playground for the current SVG, in the order the picker shows them. */
export function svgFormats({
  root,
  optimized,
  tree,
  native,
  currentColor,
  name,
  sprite,
}: SvgFormatInput): ExportFormat[] {
  const base = name.replace(/\.svg$/i, "");
  const component = componentNameFromFile(name);
  if (!root || !optimized || !tree || !native) return [];
  const codeTree = currentColor ? withCurrentColor(tree) : tree;
  return [
    { id: "optimized", label: "Optimized", filename: `${base}.min.svg`, language: "svg", code: optimized.svg },
    { id: "pretty", label: "Pretty", filename: `${base}.svg`, language: "svg", code: `${prettyPrint(root)}\n` },
    { id: "minified", label: "Minified", filename: `${base}.svg`, language: "svg", code: minify(root) },
    {
      id: "jsx",
      label: "JSX",
      filename: `${base}.jsx`,
      language: "tsx",
      code: `${toJsx(codeTree, { rootSpread: "{...props}" })}\n`,
    },
    frameworkFormat("react", component, reactComponent(codeTree, name)),
    frameworkFormat("native", component, native.code),
    frameworkFormat("vue", component, vueComponent(codeTree, name)),
    frameworkFormat("svelte", component, svelteComponent(codeTree)),
    frameworkFormat("solid", component, solidComponent(codeTree, name)),
    frameworkFormat("preact", component, preactComponent(codeTree, name)),
    frameworkFormat("qwik", component, qwikComponent(codeTree, name)),
    frameworkFormat("angular", component, angularComponent(codeTree, name)),
    frameworkFormat("lit", component, litComponent(codeTree, name)),
    frameworkFormat("astro", component, astroComponent(codeTree)),
    {
      id: "css",
      label: "CSS data URI",
      filename: `${base}.css`,
      language: "css",
      code: svgBackgroundCss(optimized.svg, base),
    },
    ...(sprite.length
      ? [
          {
            id: "sprite",
            label: "Sprite",
            filename: "sprite.svg",
            language: "svg" as const,
            code: buildSprite(sprite),
          },
          {
            id: "usage",
            label: "Sprite usage",
            filename: "usage.html",
            language: "html" as const,
            code: spriteUsage(sprite),
          },
        ]
      : []),
  ];
}
