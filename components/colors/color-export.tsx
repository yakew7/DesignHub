"use client";

import { useMemo, useState } from "react";

import { ExportPanel } from "@/components/export/export-panel";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toHex } from "@/lib/color/color";
import { colorExports } from "@/lib/color/export";
import { gradientCss } from "@/lib/color/gradient";
import { useBrandStore } from "@/store/brand-store";
import { useColorStore } from "@/store/color-store";

export function ColorExport() {
  const swatches = useColorStore((state) => state.swatches);
  const gradient = useColorStore((state) => state.gradient);
  const format = useColorStore((state) => state.format);
  const shadeOptions = useColorStore((state) => state.shadeOptions);
  const brandName = useBrandStore((state) => state.profile.name);
  const [includeShades, setIncludeShades] = useState(true);

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
      </div>
      <p className="text-xs text-subtle-foreground">
        Values use the {format.toUpperCase()} notation selected above. Switch notation to export HEX, RGB, HSL or OKLCH.
      </p>
      <ExportPanel formats={formats} label="Color export format" />
    </div>
  );
}
