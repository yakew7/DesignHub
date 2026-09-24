"use client";

import { Download, FileArchive, FileText, Globe, ImageDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CodeBlock } from "@/components/export/code-block";
import { Button } from "@/components/ui/button";
import { useVariantContext } from "@/hooks/use-variant-context";
import { downloadBlob, downloadText } from "@/lib/download";
import { buildFaviconZip, buildLogoPack, slugify, variantPdf, variantPng } from "@/lib/logo/pack";
import { logoVariants, renderVariant } from "@/lib/logo/variants";
import { useLogoStore } from "@/store/logo-store";

type Job = "png" | "pdf" | "zip" | "favicon";

export function LogoExportPanel() {
  const ctx = useVariantContext();
  const variantId = useLogoStore((state) => state.variant);
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const [busy, setBusy] = useState<Job | null>(null);
  const variant = logoVariants.find((item) => item.id === variantId) ?? logoVariants[0]!;
  const svg = useMemo(() => renderVariant(variant.id, ctx), [variant.id, ctx]);
  const file = `${slugify(ctx.name)}-${variant.id}`;

  async function run(job: Job) {
    setBusy(job);
    try {
      if (job === "png")
        downloadBlob(
          new Blob([(await variantPng(ctx, variant.id)).slice().buffer], { type: "image/png" }),
          `${file}.png`,
        );
      if (job === "pdf")
        downloadBlob(
          new Blob([(await variantPdf(ctx, variant.id)).slice().buffer], { type: "application/pdf" }),
          `${file}.pdf`,
        );
      if (job === "zip") {
        const zip = await buildLogoPack(ctx, clearSpace);
        downloadBlob(new Blob([zip.slice().buffer], { type: "application/zip" }), `${slugify(ctx.name)}-logo-pack.zip`);
      }
      if (job === "favicon") {
        const zip = await buildFaviconZip(ctx);
        downloadBlob(new Blob([zip.slice().buffer], { type: "application/zip" }), `${slugify(ctx.name)}-favicon.zip`);
      }
      toast.success("Download ready");
    } catch {
      toast.error("Export failed in this browser.");
    } finally {
      setBusy(null);
    }
  }

  const icon = (job: Job, fallback: React.ReactNode) =>
    busy === job ? <Loader2 className="animate-spin" /> : fallback;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Export · {variant.label}</h2>
        <p className="text-xs text-muted-foreground">Pick a variant in the Variants tab.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadText(svg, `${file}.svg`)}>
          <Download /> SVG
        </Button>
        <Button variant="outline" size="sm" onClick={() => run("png")} disabled={busy !== null}>
          {icon("png", <ImageDown />)} PNG
        </Button>
        <Button variant="outline" size="sm" onClick={() => run("pdf")} disabled={busy !== null}>
          {icon("pdf", <FileText />)} PDF
        </Button>
      </div>
      <Button onClick={() => run("zip")} disabled={busy !== null}>
        {icon("zip", <FileArchive />)} Logo pack (.zip)
      </Button>
      <Button variant="outline" onClick={() => run("favicon")} disabled={busy !== null}>
        {icon("favicon", <Globe />)} Favicon package (.zip)
      </Button>
      <CodeBlock code={svg} filename={`${file}.svg`} maxHeight="20rem" />
    </>
  );
}
