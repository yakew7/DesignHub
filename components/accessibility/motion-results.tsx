"use client";

import { Check, X } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { MotionSection } from "@/lib/a11y/motion";
import { cn } from "@/lib/utils";

/** Which animated effects from the Effects Lab have a reduced-motion rule in their exported CSS. */
export function MotionResults({ section }: { section: MotionSection }) {
  const { t } = useI18n();
  return (
    <Panel
      collapsible
      id="a11y-motion"
      title={t("a11y.tab.motion")}
      description="Reads the CSS each Effects Lab effect exports. Anything that animates or moves needs a prefers-reduced-motion rule."
    >
      {section.checks.length ? (
        <ul className="flex flex-col gap-2" aria-label={t("a11y.motion.moving")}>
          {section.checks.map((row) => (
            <li
              key={row.check}
              className={cn(
                "flex items-start justify-between gap-3 rounded-md border p-3",
                row.pass ? "border-success/30" : "border-destructive/40",
              )}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{row.check}</span>
                <span className="text-xs text-muted-foreground">{row.motion}</span>
                <span className="text-xs text-muted-foreground">
                  {row.reducedMotionRule
                    ? "Has a prefers-reduced-motion rule."
                    : "No prefers-reduced-motion rule in its CSS."}
                </span>
              </div>
              <Badge variant={row.pass ? "success" : "destructive"}>
                {row.pass ? <Check aria-hidden /> : <X aria-hidden />}
                {row.pass ? t("a11y.verdict.pass") : t("a11y.verdict.fail")}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="text-xs text-muted-foreground">
          {t("a11y.motion.none")}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t("a11y.motion.hint")}</p>
    </Panel>
  );
}
