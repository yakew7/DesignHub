"use client";

import "@/lib/i18n/areas/svg";

import { useMemo, useState } from "react";

import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { SwitchField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { StudioLayout } from "@/components/layout/studio-layout";
import { SvgControls } from "@/components/svg/svg-controls";
import { SvgDropzone } from "@/components/svg/svg-dropzone";
import { SvgOutput } from "@/components/svg/svg-output";
import { useParsedSvg } from "@/hooks/use-parsed-svg";
import { useOptimizedSvg } from "@/hooks/use-optimized-svg";
import { translateLocalized } from "@/lib/i18n/errors";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { minify } from "@/lib/svg/serialize";
import { withHighlight } from "@/lib/svg/tree";
import { useSvgStore } from "@/store/svg-store";

export function SvgWorkspace() {
  const { t } = useI18n();
  const parsed = useParsedSvg();
  const optimized = useOptimizedSvg();
  const source = useSvgStore((state) => state.source);
  const [compare, setCompare] = useState(false);
  const original = useMemo(() => (compare ? sanitizeSvg(source) : null), [compare, source]);
  const setDocument = useSvgStore((state) => state.setDocument);
  const root = parsed.ok ? parsed.root : null;
  const selected = useSvgStore((state) => state.selected);
  const previewSvg = useMemo(() => (root ? minify(withHighlight(root, selected)) : ""), [root, selected]);

  return (
    <StudioLayout
      id="svg"
      controls={<SvgControls root={root} optimized={optimized} />}
      preview={
        <>
          {optimized ? <SwitchField label={t("svg.compare.toggle")} checked={compare} onChange={setCompare} /> : null}
          <SvgDropzone onLoad={setDocument}>
            {root ? (
              <SvgPreviewCanvas
                svg={original ?? previewSvg}
                comparisonSvg={compare && original ? optimized?.svg : undefined}
                label={t("svg.preview")}
              />
            ) : (
              <div
                role="alert"
                className="flex min-h-80 flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
              >
                {parsed.ok ? null : translateLocalized(t, parsed.problem)}
              </div>
            )}
          </SvgDropzone>
        </>
      }
      output={<SvgOutput root={root} optimized={optimized} />}
    />
  );
}
