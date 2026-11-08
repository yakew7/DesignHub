"use client";

import { Download } from "lucide-react";

import { SwitchField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { downloadText } from "@/lib/download";
import type { PlainMessageKey } from "@/lib/i18n/translate";
import type { OptimizeResult, SvgOptimizeOptions } from "@/lib/svg/optimize";
import { formatBytes } from "@/lib/svg-size";
import { useSvgStore } from "@/store/svg-store";

type BooleanOption = {
  [K in keyof SvgOptimizeOptions]: SvgOptimizeOptions[K] extends boolean ? K : never;
}[keyof SvgOptimizeOptions];

const toggles: { key: BooleanOption; label: PlainMessageKey }[] = [
  { key: "removeMetadata", label: "svg.optimize.removeMetadata" },
  { key: "removeEditorData", label: "svg.optimize.removeEditorData" },
  { key: "removeUnusedIds", label: "svg.optimize.removeUnusedIds" },
  { key: "collapseGroups", label: "svg.optimize.collapseGroups" },
  { key: "optimizePaths", label: "svg.optimize.optimizePaths" },
  { key: "cleanupNumbers", label: "svg.optimize.cleanupNumbers" },
  { key: "shortenColors", label: "svg.optimize.shortenColors" },
  { key: "styleToAttributes", label: "svg.optimize.styleToAttributes" },
  { key: "removeDimensions", label: "svg.optimize.removeDimensions" },
  { key: "pretty", label: "svg.optimize.pretty" },
];

export function OptimizePanel({ result }: { result: OptimizeResult | null }) {
  const { t, plural } = useI18n();
  const options = useSvgStore((state) => state.options);
  const setOptions = useSvgStore((state) => state.setOptions);
  const name = useSvgStore((state) => state.name);

  return (
    <Panel title={t("svg.tab.optimize")} description={t("svg.optimize.description")}>
      {result ? (
        <div
          className="flex items-center justify-between rounded-md border bg-surface px-3 py-2 font-mono text-xs"
          aria-live="polite"
        >
          <span className="text-muted-foreground">
            {formatBytes(result.before)} → <span className="text-foreground">{formatBytes(result.after)}</span>
          </span>
          <span className="font-semibold text-success">−{Math.round(result.saved * 100)}%</span>
        </div>
      ) : null}
      <SliderField
        label={t("svg.optimize.precision")}
        value={options.precision}
        min={0}
        max={5}
        onChange={(precision) => setOptions({ precision })}
        format={(value) => plural("svg.optimize.decimals", value)}
      />
      <div className="flex flex-col gap-2.5">
        {toggles.map((toggle) => (
          <SwitchField
            key={toggle.key}
            label={t(toggle.label)}
            checked={options[toggle.key]}
            onChange={(value) => setOptions({ [toggle.key]: value })}
          />
        ))}
      </div>
      <Button
        disabled={!result}
        onClick={() => result && downloadText(result.svg, name.replace(/\.svg$/i, ".min.svg"))}
      >
        <Download /> {t("svg.optimize.download")}
      </Button>
    </Panel>
  );
}
