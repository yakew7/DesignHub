"use client";

import { ImageDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toHex } from "@/lib/color/color";
import { colorExports, paletteSvg, namedPalette } from "@/lib/color/export";
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

  //PNG Download Function
  async function downloadPng() {
    if (swatches.length === 0) return;

    setDownloading(true);

    try {
      const palette = namedPalette(
        swatches.map((swatch) => swatch.color),
        shadeOptions,
      );

      const svg = paletteSvg(palette);

      const image = await rasterize(svg, 2);

      const brand = slugify(brandName.trim() || "brand");
      const blob = new Blob([image.bytes.slice().buffer], {
        type: "image/png",
      });

      downloadBlob(blob, `${brand}-colors.png`);
      toast.success("PNG download ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
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

      <Button onClick={downloadPng} disabled={downloading || swatches.length === 0}>
        {downloading ? <Loader2 className="animate-spin" /> : <ImageDown />}
        Download PNG
      </Button>
    </div>
  );
}
