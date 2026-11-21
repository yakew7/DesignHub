"use client";

import { FileCode, FileJson, FileText } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { CodeBlock } from "@/components/export/code-block";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/download";
import { stampHtml, stampMarkdown, stampReport, type A11yReport } from "@/lib/a11y/report";

export function A11yReportPanel({ report }: { report: A11yReport }) {
  const { t } = useI18n();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t("a11y.report.title")}</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label={t("a11y.report.downloadMarkdown")}
            onClick={() => downloadText(stampMarkdown(report), "accessibility-report.md")}
          >
            <FileText /> Markdown
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={t("a11y.report.downloadHtml")}
            onClick={() => downloadText(stampHtml(report), "accessibility-report.html")}
          >
            <FileCode /> HTML
          </Button>
          <Button
            size="sm"
            aria-label={t("export.downloadJson")}
            onClick={() => downloadText(stampReport(report), "accessibility-report.json")}
          >
            <FileJson /> JSON
          </Button>
        </div>
      </div>
      <CodeBlock code={json} filename="accessibility-report.json" maxHeight="32rem" />
    </>
  );
}
