"use client";

import { ImageDown, Loader2, SwatchBook } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportPanel } from "@/components/export/export-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toHex } from "@/lib/color/color";
import { adobeSwatchExchange, colorExports, namedPalette, paletteSvg } from "@/lib/color/export";
import { gradientCss } from "@/lib/color/gradient";
import { downloadBlob } from "@/lib/download";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { useBrandStore } from "@/store/brand-store";
import { useColorStore } from "@/store/color-store";

export function ColorExport() {
  const swatches = useColorStore((state) => state.swatches);
  const gradient = useColorStore((state) => state.gradient);
  const format = useColorStore((state) => state.format);
  const shadeOptions = useColorStore((state) => state.shadeOptions);
  const brandName = useBrandStore((state) => state.profile.name);
  const [includeShades, setIncludeShades] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const formats = useMemo(
    () =>
      colorExports({
        colors: swatches.map((swatch) => swatch.color),
        gradient,
        format,
        includeShades,
        shadeOptions,
        name: brandName.trim() || undefined,
      }),
    [swatches, gradient, format, includeShades, shadeOptions, brandName],
  );

  /** The palette as a PNG strip (2x), one column per color with its name and hex code. */
  async function downloadPng() {
    if (swatches.length === 0) return;
    setDownloading(true);
    try {
      const palette = namedPalette(
        swatches.map((swatch) => swatch.color),
        shadeOptions,
      );
      const image = await rasterize(paletteSvg(palette), 2);
      const blob = new Blob([image.bytes.slice().buffer], { type: "image/png" });
      downloadBlob(blob, `${slugify(brandName.trim() || "brand")}-colors.png`);
      toast.success("PNG download ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setDownloading(false);
    }
  }

  /** The palette as Adobe Swatch Exchange for Photoshop, Illustrator and InDesign; shades follow the switch. */
  function downloadAse() {
    if (swatches.length === 0) return;
    const palette = namedPalette(
      swatches.map((swatch) => swatch.color),
      shadeOptions,
    );
    const blob = new Blob([adobeSwatchExchange(palette, includeShades)], { type: "application/octet-stream" });
    downloadBlob(blob, `${slugify(brandName.trim() || "brand")}-colors.ase`);
    toast.success("ASE download ready");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 flex-1 overflow-hidden rounded-md border" aria-hidden>
          {swatches.map((swatch) => (
            <span key={swatch.id} className="flex-1" style={{ background: toHex(swatch.color) }} />
          ))}
          <span className="w-24" style={{ background: gradientCss(gradient) }} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="export-shades" checked={includeShades} onCheckedChange={setIncludeShades} />
          <Label htmlFor="export-shades">Include 50–950 shades</Label>
        </div>
        <Button size="sm" variant="outline" onClick={downloadPng} disabled={downloading || swatches.length === 0}>
          {downloading ? <Loader2 className="animate-spin" /> : <ImageDown />}
          Download PNG
        </Button>
        <Button size="sm" variant="outline" onClick={downloadAse} disabled={swatches.length === 0}>
          <SwatchBook />
          Download ASE
        </Button>
      </div>
      <p className="text-xs text-subtle-foreground">
        Values use the {format.toUpperCase()} notation selected above. Switch notation to export HEX, RGB, HSL or OKLCH.
      </p>
      <ExportPanel formats={formats} label="Color export format" />
    </div>
  );
}
