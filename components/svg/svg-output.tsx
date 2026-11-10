"use client";

import { useMemo } from "react";

import { SwitchField } from "@/components/effects/fields";
import { ExportPanel } from "@/components/export/export-panel";
import { useI18n } from "@/components/layout/locale-provider";
import { useOptimizedTree } from "@/hooks/use-optimized-tree";
import { translateLocalized } from "@/lib/i18n/errors";
import { withCurrentColor } from "@/lib/svg/jsx";
import type { OptimizeResult } from "@/lib/svg/optimize";
import { reactNativeComponent } from "@/lib/svg/react-native";
import { svgFormatName, svgFormats } from "@/lib/svg/formats";
import { useSvgStore } from "@/store/svg-store";
import type { ExportFormat } from "@/types/export";
import type { SvgNode } from "@/types/svg";

export function SvgOutput({ root, optimized }: { root: SvgNode | null; optimized: OptimizeResult | null }) {
  const { t } = useI18n();
  const name = useSvgStore((state) => state.name);
  const currentColor = useSvgStore((state) => state.currentColor);
  const sprite = useSvgStore((state) => state.sprite);
  const setCurrentColor = useSvgStore((state) => state.setCurrentColor);
  const tree = useOptimizedTree();

  const native = useMemo(() => {
    if (!tree) return null;
    return reactNativeComponent(currentColor ? withCurrentColor(tree) : tree, name);
  }, [tree, currentColor, name]);

  const formats = useMemo<ExportFormat[]>(
    () =>
      svgFormats({ root, optimized, tree, native, currentColor, name, sprite }).map((format) => ({
        ...format,
        label: svgFormatName(t, format),
      })),
    [root, optimized, tree, native, currentColor, name, sprite, t],
  );

  if (!root) return <p className="text-sm text-muted-foreground">{t("svg.output.fix")}</p>;
  return (
    <>
      <SwitchField label={t("svg.output.currentColor")} checked={currentColor} onChange={setCurrentColor} />
      <ExportPanel formats={formats} label={t("svg.output.format")} />
      {native?.notes.length ? (
        <div role="note" className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">{t("svg.output.nativeNotes")}</p>
          <ul className="list-disc pl-4">
            {native.notes.map((note) => {
              const text = translateLocalized(t, note);
              return <li key={text}>{text}</li>;
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
