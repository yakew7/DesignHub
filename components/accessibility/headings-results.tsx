"use client";

import { X } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { HeadingsSection } from "@/lib/a11y/headings";

/** The heading structure of every exported brand book page, checked on the generated HTML. */
export function HeadingsResults({ section }: { section: HeadingsSection }) {
  const { t, plural } = useI18n();
  return (
    <Panel
      title={t("a11y.headings.title")}
      description="Every exported brand book page needs exactly one h1, no skipped heading level and no empty heading. The check reads the generated HTML of the pages the brand book website would export."
    >
      {section.checks.length ? (
        <ul className="flex flex-col gap-2" aria-label={t("a11y.headings.problems")}>
          {section.checks.map((check, index) => (
            <li
              key={`${check.page}-${index}`}
              className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 p-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{check.page}</span>
                <span className="text-xs text-muted-foreground">{check.problem}</span>
              </div>
              <Badge variant="destructive">
                <X aria-hidden />
                {t("a11y.verdict.fail")}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="text-xs text-muted-foreground">
          {plural("a11y.headings.passes", section.pages)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t("a11y.headings.note")}</p>
    </Panel>
  );
}
