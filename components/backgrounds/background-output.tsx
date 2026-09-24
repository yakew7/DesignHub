"use client";

import { Download, ImageDown } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { ExportPanel } from "@/components/export/export-panel";
import { Button } from "@/components/ui/button";
import { downloadBlob, downloadText } from "@/lib/download";
import { withSvgCredit } from "@/lib/export/credit";
import { backgroundCss } from "@/lib/background/export";
import { renderBackgroundSvg } from "@/lib/background/registry";
import { svgToPngBlob } from "@/lib/icons/raster";
import { useBackgroundStore } from "@/store/background-store";
import type { ExportFormat } from "@/types/export";

export function BackgroundOutput({ svg }: { svg: string }) {
  const settings = useBackgroundStore((state) => state.settings);
  const name = `background-${settings.kind}-${settings.seed}`;

  const formats = useMemo<ExportFormat[]>(
    () => [
      { id: "css", label: "CSS", filename: `${name}.css`, language: "css", code: backgroundCss(settings) },
      { id: "svg", label: "SVG", filename: `${name}.svg`, language: "svg", code: `${withSvgCredit(svg)}\n` },
    ],
    [settings, svg, name],
  );

  async function png(multiplier: number) {
    try {
      const width = settings.width * multiplier;
      const height = settings.height * multiplier;
      downloadBlob(await svgToPngBlob(renderBackgroundSvg(settings), width, height), `${name}@${multiplier}x.png`);
    } catch {
      toast.error("PNG export failed in this browser.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => downloadText(withSvgCredit(svg), `${name}.svg`)}>
          <Download /> SVG
        </Button>
        <Button variant="outline" onClick={() => png(1)}>
          <ImageDown /> PNG
        </Button>
        <Button variant="outline" onClick={() => png(2)}>
          <ImageDown /> PNG @2x
        </Button>
      </div>
      <ExportPanel formats={formats} label="Background export format" />
    </>
  );
}
