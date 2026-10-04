"use client";

import { FileText, Globe, ImageDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { rasterize } from "@/lib/export/raster";
import { buildBrandBook } from "@/lib/guidelines/book";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { slugify } from "@/lib/logo/pack";

type Props = { ctx: GuidelineContext; pages: GuidelinePage[]; page: GuidelinePage | undefined; svg: string };

export function GuidelineExportPanel({ ctx, pages, page, svg }: Props) {
  const [busy, setBusy] = useState(false);
  const [siteBusy, setSiteBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function downloadBook() {
    setProgress(0);
    try {
      const pdf = await buildBrandBook(ctx, pages, (done, total) => setProgress(Math.round((done / total) * 100)));
      downloadBlob(
        new Blob([pdf.slice().buffer], { type: "application/pdf" }),
        `${slugify(ctx.brand.name)}-brand-guidelines.pdf`,
      );
      toast.success("Brand book ready");
    } catch {
      toast.error("Export failed in this browser.");
    } finally {
      setProgress(null);
    }
  }

  async function downloadSite() {
    setSiteBusy(true);
    try {
      const { buildBrandSite } = await import("@/lib/guidelines/site");
      const zip = buildBrandSite(ctx, pages);
      downloadBlob(
        new Blob([zip.slice().buffer], { type: "application/zip" }),
        `${slugify(ctx.brand.name)}-brand-site.zip`,
      );
      toast.success("Website ready", {
        description: "Unzip it and open index.html, or upload the folder to any host.",
      });
    } catch {
      toast.error("Export failed in this browser.");
    } finally {
      setSiteBusy(false);
    }
  }

  async function downloadPage() {
    if (!page) return;
    setBusy(true);
    try {
      const image = await rasterize(svg, 2);
      downloadBlob(
        new Blob([image.bytes.slice().buffer], { type: "image/png" }),
        `${slugify(ctx.brand.name)}-guidelines-${page.id}.png`,
      );
      toast.success("Download ready");
    } catch {
      toast.error("Export failed in this browser.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="text-sm font-medium">Export</h2>
      <p className="text-xs text-muted-foreground">
        {ctx.contents.length} pages. Every page updates live from the brand.
      </p>
      <Button onClick={downloadBook} disabled={progress !== null || pages.length === 0}>
        {progress !== null ? <Loader2 className="animate-spin" /> : <FileText />}
        {progress !== null ? `Rendering ${progress}%` : "Brand book (PDF)"}
      </Button>
      {progress !== null ? (
        <div
          role="progressbar"
          aria-label="Brand book export"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full bg-brand transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <Button variant="outline" onClick={downloadSite} disabled={siteBusy || pages.length === 0}>
        {siteBusy ? <Loader2 className="animate-spin" /> : <Globe />} Download website
      </Button>
      <Button variant="outline" onClick={downloadPage} disabled={!svg || busy}>
        {busy ? <Loader2 className="animate-spin" /> : <ImageDown />} This page (PNG)
      </Button>
    </>
  );
}
