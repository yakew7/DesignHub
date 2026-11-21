"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { ExportPanel } from "@/components/export/export-panel";
import { translateFormatLabels } from "@/lib/tokens/format-labels";
import { typographyExports } from "@/lib/typography/export";
import { useTypographyStore } from "@/store/typography-store";
import type { FontFamily } from "@/types/typography";

export function TypographyExport({ fonts }: { fonts: FontFamily[] }) {
  const { t } = useI18n();
  const headingFont = useTypographyStore((state) => state.headingFont);
  const bodyFont = useTypographyStore((state) => state.bodyFont);
  const scale = useTypographyStore((state) => state.scale);
  const rhythm = useTypographyStore((state) => state.rhythm);
  const openType = useTypographyStore((state) => state.openType);

  const formats = useMemo(() => {
    const heading = fonts.find((font) => font.family === headingFont);
    const body = fonts.find((font) => font.family === bodyFont);
    if (!heading || !body) return [];
    return translateFormatLabels(t, typographyExports({ heading, body, scale, rhythm, openType }));
  }, [fonts, headingFont, bodyFont, scale, rhythm, openType, t]);

  if (formats.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading font metadata…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Exports use your pairing (<strong className="font-medium text-foreground">{headingFont}</strong> +{" "}
        <strong className="font-medium text-foreground">{bodyFont}</strong>), fluid type scale, rhythm and enabled
        OpenType features. Fallback CSS emits a size-adjusted local face (Arial, Times New Roman or Courier New) so
        layout stays stable while the webfont loads.
      </p>
      <ExportPanel formats={formats} label="Typography export format" />
    </div>
  );
}
