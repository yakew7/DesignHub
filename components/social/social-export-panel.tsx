"use client";

import { ClipboardCopy, FileArchive, FileCode, ImageDown, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/ui/panel";
import { downloadBlob, downloadText } from "@/lib/download";
import { withSvgCredit } from "@/lib/export/credit";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { buildSocialPack } from "@/lib/social/pack";
import { socialTemplates } from "@/lib/social/registry";
import { readmeSnippet } from "@/lib/social/readme";
import { ogMetaTags } from "@/lib/social/templates/open-graph";
import type { SocialContext, SocialTemplate } from "@/lib/social/types";
import { useSocialStore } from "@/store/social-store";

type Props = { svg: string; ctx: SocialContext; template: SocialTemplate | undefined };

type Job = "png" | "png1" | "png2" | "copy" | "zip";

const pngBlob = (bytes: Uint8Array) => new Blob([bytes.slice().buffer], { type: "image/png" });

export function SocialExportPanel({ svg, ctx, template }: Props) {
  const [busy, setBusy] = useState<Job | null>(null);
  const [packProgress, setPackProgress] = useState<number | null>(null);
  const base = template ? `${slugify(ctx.brand.name)}-${template.id}` : "";
  const meta = template?.platform === "Open Graph" ? ogMetaTags(ctx, "og.png") : null;
  const credit = useSocialStore((state) => state.credit);
  const setCredit = useSocialStore((state) => state.setCredit);
  const readme = template?.platform === "GitHub" ? readmeSnippet(ctx, { path: ".github/banner.png", credit }) : null;

  async function run(job: Job, action: () => Promise<void>) {
    setBusy(job);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Export failed in this browser.");
    } finally {
      setBusy(null);
    }
  }

  const png = (scale: number, job: Job) =>
    run(job, async () => {
      const image = await rasterize(svg, scale);
      downloadBlob(pngBlob(image.bytes), `${base}${scale > 1 ? `@${scale}x` : ""}.png`);
      toast.success("Download ready");
    });

  const copyImage = () =>
    run("copy", async () => {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("This browser can't copy images. Download the PNG instead.");
      }
      const image = await rasterize(svg, 1);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob(image.bytes) })]);
      toast.success("Image copied to the clipboard");
    });

  async function downloadAll() {
    setPackProgress(0);
    try {
      const zip = await buildSocialPack(ctx, (done, total) => setPackProgress(Math.round((done / total) * 100)));
      downloadBlob(
        new Blob([zip.slice().buffer], { type: "application/zip" }),
        `${slugify(ctx.brand.name)}-social.zip`,
      );
      toast.success("Social pack ready");
    } catch {
      toast.error("Export failed in this browser.");
    } finally {
      setPackProgress(null);
    }
  }

  const spin = (job: Job, icon: ReactNode) => (busy === job ? <Loader2 className="animate-spin" /> : icon);
  const disabled = !svg || busy !== null;

  return (
    <Panel
      title="Export"
      description={template ? `${template.platform} · ${template.width} × ${template.height} px` : undefined}
    >
      <Button size="lg" className="w-full" onClick={() => png(1, "png")} disabled={disabled}>
        {spin("png", <ImageDown />)} Export PNG
      </Button>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button variant="outline" onClick={() => png(1, "png1")} disabled={disabled}>
          {spin("png1", <ImageDown />)} @1x
        </Button>
        <Button variant="outline" onClick={() => png(2, "png2")} disabled={disabled}>
          {spin("png2", <ImageDown />)} @2x
        </Button>
        <Button variant="outline" onClick={() => downloadText(withSvgCredit(svg), `${base}.svg`)} disabled={disabled}>
          <FileCode /> SVG
        </Button>
        <Button variant="outline" onClick={copyImage} disabled={disabled}>
          {spin("copy", <ClipboardCopy />)} Copy image
        </Button>
      </div>
      <Button variant="ghost" onClick={downloadAll} disabled={packProgress !== null}>
        {packProgress !== null ? <Loader2 className="animate-spin" /> : <FileArchive />}
        {packProgress !== null ? `Rendering ${packProgress}%` : `All ${socialTemplates.length} assets (ZIP)`}
      </Button>
      {readme ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label>README snippet</Label>
            <CopyButton value={readme} label="Copy README snippet" toastMessage="README snippet copied" />
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border bg-surface-raised p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {readme}
          </pre>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="social-credit" className="text-xs font-normal text-muted-foreground">
              Add a small &quot;Banner made with DesignHub&quot; link under the banner
            </Label>
            <Switch id="social-credit" checked={credit} onCheckedChange={setCredit} />
          </div>
          <p className="text-[11px] text-subtle-foreground">
            Save the PNG as <code>.github/banner.png</code> in your repository, then paste this at the top of your
            README. For the link preview, upload the same PNG under Settings, Social preview.
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-subtle-foreground">
            Want it featured in the DesignHub gallery? Add the
            <CopyButton
              value="made-with-designhub"
              label="Copy topic made-with-designhub"
              toastMessage="Topic copied"
              variant="outline"
              size="sm"
              className="h-6 px-2 font-mono text-[11px]"
            >
              made-with-designhub
            </CopyButton>
            topic to your repository (the gear next to About).
          </p>
        </div>
      ) : null}
      {meta ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Meta tags</Label>
            <CopyButton value={meta} label="Copy meta tags" toastMessage="Meta tags copied" />
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border bg-surface-raised p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {meta}
          </pre>
          <p className="text-[11px] text-subtle-foreground">Upload the PNG as og.png at your site root.</p>
        </div>
      ) : null}
    </Panel>
  );
}
