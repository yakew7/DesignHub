"use client";

import { Download, ImageDown } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { ExportPanel } from "@/components/export/export-panel";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useIcon } from "@/hooks/use-icon-data";
import { useForegroundHex } from "@/hooks/use-theme-color";
import { downloadBlob } from "@/lib/download";
import { buildIco } from "@/lib/icons/favicon";
import { iconExports } from "@/lib/icons/export";
import { splitIconId } from "@/lib/icons/iconify";
import { svgToPngBlob } from "@/lib/icons/raster";
import { buildIconSvg } from "@/lib/icons/svg";
import { useIconStore } from "@/store/icon-store";

const PNG_SIZES = [16, 32, 64, 128, 256, 512, 1024];

export function IconExport() {
  const { t } = useI18n();
  const selected = useIconStore((state) => state.selected);
  const style = useIconStore((state) => state.style);
  const icon = useIcon(selected);
  const foreground = useForegroundHex();
  const formats = useMemo(() => (icon ? iconExports(selected, icon, style) : []), [icon, selected, style]);
  const { name } = splitIconId(selected);

  // Raster formats can't inherit currentColor, so bake in the current theme's text color.
  const rasterStyle = { ...style, color: style.color === "currentColor" ? foreground : style.color };

  async function png(size: number) {
    if (!icon) return;
    try {
      const blob = await svgToPngBlob(buildIconSvg(icon, { ...rasterStyle, size }), size);
      downloadBlob(blob, `${name}-${size}.png`);
    } catch {
      toast.error(t("icons.export.pngFailed"));
    }
  }

  async function ico() {
    if (!icon) return;
    const bytes = await buildIco(icon, rasterStyle);
    downloadBlob(new Blob([bytes.slice().buffer], { type: "image/x-icon" }), `${name}.ico`);
  }

  if (!icon) return <div className="h-64 animate-pulse rounded-lg bg-muted" />;

  return (
    <div className="flex flex-col gap-6">
      <Panel title={t("icons.export.raster")} description={t("icons.export.rasterNote")}>
        <div className="flex flex-wrap gap-2">
          {PNG_SIZES.map((size) => (
            <Button key={size} variant="outline" size="sm" onClick={() => png(size)}>
              <ImageDown /> {size}px
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={ico}>
            <Download /> .ico
          </Button>
        </div>
      </Panel>
      <ExportPanel formats={formats} label={t("icons.export.label")} />
    </div>
  );
}
