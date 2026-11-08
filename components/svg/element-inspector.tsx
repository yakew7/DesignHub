"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { PaintEditor } from "@/components/svg/paint-editor";
import { inspectPath } from "@/lib/svg/inspect";
import { prettyPrint } from "@/lib/svg/serialize";
import { getNode, updateAttributes, updateAllShapes } from "@/lib/svg/tree";
import { useSvgStore } from "@/store/svg-store";
import type { SvgNode } from "@/types/svg";

export function ElementInspector({ root }: { root: SvgNode }) {
  const { t } = useI18n();
  const selected = useSvgStore((state) => state.selected);
  const setSource = useSvgStore((state) => state.setSource);
  const node = selected ? getNode(root, selected) : null;
  const report = useMemo(
    () => (node?.name === "path" && node.attributes.d ? inspectPath(node.attributes.d) : null),
    [node],
  );

  const apply = (next: SvgNode) => setSource(prettyPrint(next));

  return (
    <div className="flex flex-col gap-4">
      {node && selected ? (
        <section aria-label={t("svg.layers.selected")} className="flex flex-col gap-3 rounded-md border p-3">
          <h3 className="font-mono text-xs font-medium">&lt;{node.name}&gt;</h3>
          <PaintEditor
            idPrefix="el"
            attributes={node.attributes}
            onChange={(patch) => apply(updateAttributes(root, selected, patch))}
          />
          {report ? (
            <div className="flex flex-col gap-2 text-xs">
              {report.error ? <p className="text-destructive">{report.error}</p> : null}
              <dl className="grid grid-cols-3 gap-1.5">
                <div className="rounded-sm bg-muted px-2 py-1">
                  <dt className="text-subtle-foreground">{t("svg.layers.commands")}</dt>
                  <dd className="font-mono">{report.commands.length}</dd>
                </div>
                <div className="rounded-sm bg-muted px-2 py-1">
                  <dt className="text-subtle-foreground">{t("svg.layers.subpaths")}</dt>
                  <dd className="font-mono">{report.subpaths}</dd>
                </div>
                <div className="rounded-sm bg-muted px-2 py-1">
                  <dt className="text-subtle-foreground">{t("svg.layers.bounds")}</dt>
                  <dd className="truncate font-mono">
                    {report.bounds ? `${report.bounds.width}×${report.bounds.height}` : "-"}
                  </dd>
                </div>
              </dl>
              <p className="text-subtle-foreground">
                {Object.entries(report.counts)
                  .map(([command, count]) => `${count} ${command}`)
                  .join(" · ")}
              </p>
              <ol
                className="max-h-40 overflow-y-auto rounded-sm border bg-surface p-2 font-mono text-[11px] scrollbar-thin"
                aria-label={t("svg.layers.pathCommands")}
              >
                {report.commands.slice(0, 200).map((command, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="w-4 text-brand">{command.code}</span>
                    <span className="truncate text-muted-foreground">{command.values}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              {t("svg.layers.allAttributes", { count: Object.keys(node.attributes).length })}
            </summary>
            <dl className="mt-2 flex flex-col gap-1 font-mono text-[11px]">
              {Object.entries(node.attributes).map(([name, value]) => (
                <div key={name} className="flex gap-2">
                  <dt className="shrink-0 text-subtle-foreground">{name}</dt>
                  <dd className="truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">{t("svg.layers.selectPrompt")}</p>
      )}
      <section
        aria-label={t("svg.layers.applyAll")}
        className="flex flex-col gap-3 rounded-md border border-dashed p-3"
      >
        <h3 className="text-xs font-medium">{t("svg.layers.allShapes")}</h3>
        <PaintEditor idPrefix="all" attributes={{}} onChange={(patch) => apply(updateAllShapes(root, patch))} />
      </section>
    </div>
  );
}
