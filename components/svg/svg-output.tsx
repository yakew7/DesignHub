"use client";

import { useMemo } from "react";

import { SwitchField } from "@/components/effects/fields";
import { ExportPanel } from "@/components/export/export-panel";
import { useOptimizedSvg } from "@/hooks/use-optimized-svg";
import { useOptimizedTree } from "@/hooks/use-optimized-tree";
import { angularComponent, kebabCase } from "@/lib/svg/angular";
import { componentNameFromFile, reactComponent, toJsx, withCurrentColor } from "@/lib/svg/jsx";
import { svgBackgroundCss } from "@/lib/svg/data-uri";
import { reactNativeComponent } from "@/lib/svg/react-native";
import { minify, prettyPrint } from "@/lib/svg/serialize";
import { buildSprite, spriteUsage } from "@/lib/svg/sprite";
import { svelteComponent } from "@/lib/svg/svelte";
import { vueComponent } from "@/lib/svg/vue";
import { useSvgStore } from "@/store/svg-store";
import type { ExportFormat } from "@/types/export";
import type { SvgNode } from "@/types/svg";

export function SvgOutput({ root }: { root: SvgNode | null }) {
  const name = useSvgStore((state) => state.name);
  const currentColor = useSvgStore((state) => state.currentColor);
  const sprite = useSvgStore((state) => state.sprite);
  const setCurrentColor = useSvgStore((state) => state.setCurrentColor);
  const optimized = useOptimizedSvg();
  const tree = useOptimizedTree();
  const base = name.replace(/\.svg$/i, "");

  const native = useMemo(() => {
    if (!tree) return null;
    return reactNativeComponent(currentColor ? withCurrentColor(tree) : tree, name);
  }, [tree, currentColor, name]);

  const formats = useMemo<ExportFormat[]>(() => {
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
      {
        id: "react",
        label: "React",
        filename: `${componentNameFromFile(name)}.tsx`,
        language: "tsx",
        code: reactComponent(codeTree, name),
      },
      {
        id: "native",
        label: "React Native",
        filename: `${componentNameFromFile(name)}.native.tsx`,
        language: "tsx",
        code: native.code,
      },
      {
        id: "vue",
        label: "Vue",
        filename: `${componentNameFromFile(name)}.vue`,
        language: "vue",
        code: vueComponent(codeTree, name),
      },
      {
        id: "svelte",
        label: "Svelte",
        filename: `${componentNameFromFile(name)}.svelte`,
        language: "svelte",
        code: svelteComponent(codeTree),
      },
      {
        id: "angular",
        label: "Angular",
        filename: `${kebabCase(componentNameFromFile(name))}.component.ts`,
        language: "ts",
        code: angularComponent(codeTree, name),
      },
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
  }, [root, optimized, tree, native, currentColor, base, name, sprite]);

  if (!root) return <p className="text-sm text-muted-foreground">Fix the SVG to see the generated code.</p>;
  return (
    <>
      <SwitchField label="Use currentColor in components" checked={currentColor} onChange={setCurrentColor} />
      <ExportPanel formats={formats} label="SVG output format" />
      {native?.warnings.length ? (
        <div role="note" className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">React Native notes</p>
          <ul className="list-disc pl-4">
            {native.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
