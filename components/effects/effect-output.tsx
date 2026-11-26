"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { useIsAdvanced } from "@/components/ui/advanced";
import { ExportPanel } from "@/components/export/export-panel";
import { reactStyle, scssMixin, effectStylesheet, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import type { EffectCss, EffectKind } from "@/types/effects";
import type { ExportFormat } from "@/types/export";

export function EffectOutput({ kind, effect }: { kind: EffectKind; effect: EffectCss | null }) {
  const { t } = useI18n();
  const advanced = useIsAdvanced();
  const formats = useMemo<ExportFormat[]>(() => {
    if (!effect) return [];
    const selector = `.${kind}`;
    // One utility per line; whitespace inside a class attribute is insignificant.
    const classes = tailwindClasses(effect.declarations).split(" ").join("\n    ");
    const note = effect.tailwindNote ? `\n\n<!-- ${effect.tailwindNote} -->` : "";
    const all: ExportFormat[] = [
      { id: "css", label: "CSS", filename: `${kind}.css`, language: "css", code: effectStylesheet(effect, selector) },
      {
        id: "tailwind",
        label: "Tailwind",
        filename: `${kind}.html`,
        language: "html",
        code: `<div\n  class="\n    ${classes}\n  "\n>\n  …\n</div>${note}\n`,
      },
      {
        id: "utility",
        label: "@utility",
        filename: `${kind}.utility.css`,
        language: "css",
        code: tailwindUtility(`fx-${kind}`, effect),
      },
      { id: "scss", label: "SCSS", filename: `_${kind}.scss`, language: "scss", code: scssMixin(`fx-${kind}`, effect) },
      { id: "react", label: "React", filename: `${kind}.ts`, language: "ts", code: reactStyle(kind, effect) },
    ];
    // Simple mode: the two formats most people paste. Advanced adds the utility, the mixin and the style object.
    return advanced ? all : all.filter((format) => format.id === "css" || format.id === "tailwind");
  }, [effect, kind, advanced]);

  if (!effect) return <p className="text-sm text-muted-foreground">{t("effects.output.empty")}</p>;
  return <ExportPanel key={kind} formats={formats} label="Effect code format" />;
}
