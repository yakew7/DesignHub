"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { CopyButton } from "@/components/ui/copy-button";
import { fontStack } from "@/lib/typography/css";
import { recommendedLineHeight, recommendedTracking } from "@/lib/typography/scale";
import type { TypeScaleStep } from "@/types/typography";

type ScaleTableProps = {
  steps: TypeScaleStep[];
  headingFont: string;
  bodyFont: string;
};

export function ScaleTable({ steps, headingFont, bodyFont }: ScaleTableProps) {
  const { t } = useI18n();
  return (
    <ol className="flex flex-col divide-y rounded-lg border bg-card" aria-label={t("typography.tab.scale")}>
      {steps.map((step) => {
        const isHeading = step.step > 0;
        return (
          <li key={step.name} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-medium">{step.name}</span>
                <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">
                  {step.minPx}→{step.maxPx}px
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-1">
                <code className="truncate rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {step.clamp}
                </code>
                <CopyButton value={step.clamp} label={`Copy ${step.name} clamp`} className="size-7" />
              </div>
            </div>
            <p
              className="break-words"
              style={{
                fontFamily: fontStack(isHeading ? headingFont : bodyFont),
                fontSize: step.clamp,
                lineHeight: recommendedLineHeight(step.maxPx),
                letterSpacing: `${recommendedTracking(step.maxPx)}em`,
                fontWeight: isHeading ? 600 : 400,
              }}
            >
              {isHeading ? "Design with intent" : "Readable, comfortable body text at every size."}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
