"use client";

import { Download, FileArchive, FileText, Globe, ImageDown, Loader2, PenTool, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CodeBlock } from "@/components/export/code-block";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useVariantContext } from "@/hooks/use-variant-context";
import { downloadBlob, downloadText } from "@/lib/download";
import { rasterize } from "@/lib/export/raster";
import { drawOnSvg } from "@/lib/logo/animate";
import { buildFaviconZip, buildLogoPack, slugify, variantPdf, variantPng } from "@/lib/logo/pack";
import { logoVariants, renderVariant } from "@/lib/logo/variants";
import { svgDataUri } from "@/lib/svg/data-uri";
import { useLogoStore } from "@/store/logo-store";

type Job = "png" | "webp" | "pdf" | "zip" | "favicon";

export function LogoExportPanel() {
  const ctx = useVariantContext();
  const variantId = useLogoStore((state) => state.variant);
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const [busy, setBusy] = useState<Job | null>(null);
  const [loop, setLoop] = useState(false);
  const [replay, setReplay] = useState(0);
  const variant = logoVariants.find((item) => item.id === variantId) ?? logoVariants[0]!;
  const svg = useMemo(() => renderVariant(variant.id, ctx), [variant.id, ctx]);
  const file = `${slugify(ctx.name)}-${variant.id}`;
  const animated = useMemo(() => drawOnSvg(svg, { loop }), [svg, loop]);

  async function run(job: Job) {
    setBusy(job);
    try {
      if (job === "png")
        downloadBlob(
          new Blob([(await variantPng(ctx, variant.id)).slice().buffer], { type: "image/png" }),
          `${file}.png`,
        );
      if (job === "webp") {
        const image = await rasterize(svg, 4, 8192, "webp");
        downloadBlob(new Blob([image.bytes.slice().buffer], { type: "image/webp" }), `${file}.webp`);
      }
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
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Export failed in this browser.");
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button variant="outline" size="sm" onClick={() => downloadText(svg, `${file}.svg`)}>
          <Download /> SVG
        </Button>
        <Button variant="outline" size="sm" onClick={() => run("png")} disabled={busy !== null}>
          {icon("png", <ImageDown />)} PNG
        </Button>
        <Button variant="outline" size="sm" onClick={() => run("webp")} disabled={busy !== null}>
          {icon("webp", <ImageDown />)} WebP
        </Button>
        <Button variant="outline" size="sm" onClick={() => run("pdf")} disabled={busy !== null}>
          {icon("pdf", <FileText />)} PDF
        </Button>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          {animated ? (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-checker p-1.5">
              {/* An <img> data URL runs the SVG's CSS animation and nothing else. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG preview */}
              <img
                key={replay}
                src={svgDataUri(animated)}
                alt={`${variant.label} drawing itself`}
                className="max-h-full max-w-full object-contain"
              />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">Animated SVG</span>
            <span className="text-xs text-muted-foreground">
              Outlines draw in, then fills fade in. Shows the finished logo when motion is reduced.
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Replay animation"
            onClick={() => setReplay((value) => value + 1)}
            disabled={!animated}
          >
            <RotateCcw />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch id="logo-animated-loop" checked={loop} onCheckedChange={setLoop} />
            <Label htmlFor="logo-animated-loop" className="text-xs font-normal">
              Loop
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!animated}
            onClick={() => animated && downloadText(animated, `${file}-animated.svg`)}
          >
            <PenTool /> Animated SVG
          </Button>
        </div>
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
