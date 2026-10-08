"use client";

import { Brush, ChevronDown, Download, ImageDown, Loader2, Palette, SwatchBook } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportPanel } from "@/components/export/export-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toHex } from "@/lib/color/color";
import {
  adobeSwatchExchange,
  colorExports,
  namedPalette,
  paletteSvg,
  procreateSwatches,
  procreateSwatchLimit,
  sketchPalette,
} from "@/lib/color/export";
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const filename = (extension: string) => `${slugify(brandName.trim() || "brand")}-colors.${extension}`;
  const palette = () =>
    namedPalette(
      swatches.map((swatch) => swatch.color),
      shadeOptions,
    );

  /** The palette as a PNG strip (2x), one column per color with its name and hex code. */
  async function downloadPng() {
    if (swatches.length === 0) return;
    setDownloading(true);
    try {
      const image = await rasterize(paletteSvg(palette()), 2);
      const blob = new Blob([image.bytes.slice().buffer], { type: "image/png" });
      downloadBlob(blob, filename("png"));
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
    const blob = new Blob([adobeSwatchExchange(palette(), includeShades)], { type: "application/octet-stream" });
    downloadBlob(blob, filename("ase"));
    toast.success("ASE download ready");
  }

  /** The palette for the Sketch Palettes plugin; shades follow the switch. */
  function downloadSketch() {
    if (swatches.length === 0) return;
    downloadBlob(
      new Blob([sketchPalette(palette(), includeShades)], { type: "application/json" }),
      filename("sketchpalette"),
    );
    toast.success("Sketch palette download ready");
  }

  /** Procreate swatches; shades go in only when the palette fits in Procreate's 30 slots. */
  function downloadProcreate() {
    if (swatches.length === 0) return;
    const result = procreateSwatches(palette(), includeShades, brandName.trim() || undefined);
    downloadBlob(new Blob([result.bytes], { type: "application/zip" }), filename("swatches"));
    const notes = [
      result.shadesDropped ? "Shades don't fit, so only the base colors are included." : "",
      result.colorsDropped > 0 ? `The last ${result.colorsDropped} colors were left out.` : "",
    ].filter(Boolean);
    toast.success("Procreate swatches ready", {
      description: notes.length
        ? `Procreate palettes hold ${procreateSwatchLimit} swatches. ${notes.join(" ")}`
        : undefined,
    });
  }

  const downloads = [
    { label: "PNG image", hint: ".png", icon: ImageDown, run: downloadPng },
    { label: "Adobe swatches", hint: ".ase", icon: SwatchBook, run: downloadAse },
    { label: "Sketch palette", hint: ".sketchpalette", icon: Palette, run: downloadSketch },
    { label: "Procreate swatches", hint: ".swatches", icon: Brush, run: downloadProcreate },
  ];

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
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" disabled={downloading || swatches.length === 0}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              Download
              <ChevronDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-1" aria-label="Download palette">
            {downloads.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setMenuOpen(false);
                  void item.run();
                }}
              >
                <item.icon />
                {item.label}
                <span className="ml-auto text-xs text-subtle-foreground">{item.hint}</span>
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xs text-subtle-foreground">
        Values use the {format.toUpperCase()} notation selected above. Switch notation to export HEX, RGB, HSL or OKLCH.
      </p>
      <ExportPanel formats={formats} label="Color export format" />
    </div>
  );
}
