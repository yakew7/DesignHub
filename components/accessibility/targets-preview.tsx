"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { evaluateTargets } from "@/lib/a11y/targets";
import { cn } from "@/lib/utils";
import { useA11yStore } from "@/store/a11y-store";

/** Targets drawn to scale with the 24px AA circle and the 44px AAA box as guides. */
export function TargetsPreview() {
  const { t } = useI18n();
  const targets = useA11yStore((state) => state.targets);
  const gap = useA11yStore((state) => state.targetGap);
  const colors = useA11yStore((state) => state.colors);
  const results = useMemo(() => evaluateTargets(targets, gap), [targets, gap]);

  return (
    <figure className="flex flex-col gap-3 rounded-lg border p-6" style={{ background: colors.background }}>
      <div className="flex flex-wrap items-center" style={{ gap }}>
        {results.map((result) => (
          <div key={result.target.id} className="relative flex items-center justify-center">
            <span
              className="flex items-center justify-center truncate rounded-md px-1 text-xs font-semibold"
              style={{
                width: result.target.width,
                height: result.target.height,
                background: colors.accent,
                color: colors.onAccent,
              }}
            >
              {result.target.width >= 40 ? result.target.label : ""}
            </span>
            {result.aaa ? null : (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute size-6 rounded-full border-2",
                  result.aa ? "border-success" : "border-destructive",
                )}
              />
            )}
            {result.aaa ? null : (
              <span
                aria-hidden
                className="pointer-events-none absolute size-11 rounded-sm border border-dashed border-current opacity-40"
                style={{ color: colors.text }}
              />
            )}
          </div>
        ))}
      </div>
      <figcaption className="text-xs" style={{ color: colors.text }}>
        {t("a11y.targets.legend")}
      </figcaption>
    </figure>
  );
}
