"use client";

import { ClipboardCopy, FileArchive, FileCode, ImageDown, Loader2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { Advanced } from "@/components/ui/advanced";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/components/ui/panel";
import { downloadBlob, downloadText } from "@/lib/download";
import { withSvgCredit } from "@/lib/export/credit";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { SocialPackPicker } from "@/components/social/social-pack-picker";
import { buildSocialPack, packTemplates } from "@/lib/social/pack";
import { readmeSnippet } from "@/lib/social/readme";
import { ogMetaTags } from "@/lib/social/templates/open-graph";
import type { SocialContext, SocialTemplateInfo } from "@/lib/social/types";
import { useSocialStore } from "@/store/social-store";

type Props = { svg: string; ctx: SocialContext; template: SocialTemplateInfo | undefined };

type Job = "png" | "png1" | "png2" | "webp" | "copy" | "zip";

const pngBlob = (bytes: Uint8Array) => new Blob([bytes.slice().buffer], { type: "image/png" });

export function SocialExportPanel({ svg, ctx, template }: Props) {
  const { t, plural } = useI18n();
  const [busy, setBusy] = useState<Job | null>(null);
  const [packProgress, setPackProgress] = useState<number | null>(null);
  const base = template ? `${slugify(ctx.brand.name)}-${template.id}` : "";
  const meta = template?.platform === "Open Graph" ? ogMetaTags(ctx, "og.png") : null;
  const credit = useSocialStore((state) => state.credit);
  const packSelection = useSocialStore((state) => state.packSelection);
  const packCount = packTemplates(packSelection).length;
  const setCredit = useSocialStore((state) => state.setCredit);
  const readme = template?.platform === "GitHub" ? readmeSnippet(ctx, { path: ".github/banner.png", credit }) : null;

  async function run(job: Job, action: () => Promise<void>) {
    setBusy(job);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("command.exportFailed"));
    } finally {
      setBusy(null);
    }
  }

  const png = (scale: number, job: Job) =>
    run(job, async () => {
      const image = await rasterize(svg, scale);
      downloadBlob(pngBlob(image.bytes), `${base}${scale > 1 ? `@${scale}x` : ""}.png`);
      toast.success(t("command.downloadReady"));
    });

  const webp = () =>
    run("webp", async () => {
      const image = await rasterize(svg, 1, 8192, "webp");
      downloadBlob(new Blob([image.bytes.slice().buffer], { type: "image/webp" }), `${base}.webp`);
      toast.success(t("command.downloadReady"));
    });

  const copyImage = () =>
    run("copy", async () => {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error(t("social.export.cantCopy"));
      }
      const image = await rasterize(svg, 1);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob(image.bytes) })]);
      toast.success(t("social.export.imageCopied"));
    });

  const stopPack = useRef<AbortController | null>(null);

  async function downloadAll() {
    setPackProgress(0);
    const controller = new AbortController();
    stopPack.current = controller;
    try {
      const zip = await buildSocialPack(
        ctx,
        (done, total) => setPackProgress(Math.round((done / total) * 100)),
        packSelection,
        controller.signal,
      );
      downloadBlob(
        new Blob([zip.slice().buffer], { type: "application/zip" }),
        `${slugify(ctx.brand.name)}-social.zip`,
      );
      toast.success(t("social.export.packReady"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") toast(t("social.export.packCancelled"));
      else toast.error(t("command.exportFailed"));
    } finally {
      stopPack.current = null;
      setPackProgress(null);
    }
  }

  // The file name sits in a <code> element, so the message is split around it.
  const readmeHelp = t("social.export.readmeHelp", { file: "{file}" }).split("{file}");
  const spin = (job: Job, icon: ReactNode) => (busy === job ? <Loader2 className="animate-spin" /> : icon);
  const disabled = !svg || busy !== null;

  return (
    <Panel
      title={t("social.export.title")}
      description={template ? `${template.platform} · ${template.width} × ${template.height} px` : undefined}
    >
      <Button size="lg" className="w-full" onClick={() => png(1, "png")} disabled={disabled}>
        {spin("png", <ImageDown />)} {t("social.export.png")}
      </Button>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Button variant="outline" onClick={() => png(1, "png1")} disabled={disabled}>
          {spin("png1", <ImageDown />)} @1x
        </Button>
        <Button variant="outline" onClick={() => png(2, "png2")} disabled={disabled}>
          {spin("png2", <ImageDown />)} @2x
        </Button>
        <Button variant="outline" onClick={() => downloadText(withSvgCredit(svg), `${base}.svg`)} disabled={disabled}>
          <FileCode /> SVG
        </Button>
        <Button variant="outline" onClick={webp} disabled={disabled}>
          {spin("webp", <ImageDown />)} WebP
        </Button>
        <Button variant="outline" onClick={copyImage} disabled={disabled}>
          {spin("copy", <ClipboardCopy />)} {t("social.export.copyImage")}
        </Button>
      </div>
      <Advanced>
        <SocialPackPicker />
      </Advanced>
      <Button variant="outline" onClick={downloadAll} disabled={packProgress !== null || packCount === 0}>
        {packProgress !== null ? <Loader2 className="animate-spin" /> : <FileArchive />}
        {packProgress !== null
          ? t("social.export.rendering", { percent: packProgress })
          : plural("social.export.zip", packCount)}
      </Button>
      {packProgress !== null ? (
        <Button variant="ghost" size="sm" onClick={() => stopPack.current?.abort()}>
          {t("common.cancel")}
        </Button>
      ) : null}
      {readme ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label>{t("social.export.readme")}</Label>
            <CopyButton
              value={readme}
              label={t("social.export.copyReadme")}
              toastMessage={t("social.export.readmeCopied")}
            />
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border bg-surface-raised p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {readme}
          </pre>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="social-credit" className="text-xs font-normal text-muted-foreground">
              {t("social.export.credit")}
            </Label>
            <Switch id="social-credit" checked={credit} onCheckedChange={setCredit} />
          </div>
          <p className="text-xs text-subtle-foreground">
            {readmeHelp[0]}
            <code>.github/banner.png</code>
            {readmeHelp[1]}
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-subtle-foreground">
            {t("social.export.galleryBefore")}
            <CopyButton
              value="made-with-designhub"
              label={t("social.export.copyTopic", { topic: "made-with-designhub" })}
              toastMessage={t("social.export.topicCopied")}
              variant="outline"
              size="sm"
              className="h-6 px-2 font-mono text-xs"
            >
              made-with-designhub
            </CopyButton>
            {t("social.export.galleryAfter")}
          </p>
        </div>
      ) : null}
      {meta ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>{t("social.export.metaTags")}</Label>
            <CopyButton value={meta} label={t("social.export.copyMeta")} toastMessage={t("social.export.metaCopied")} />
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border bg-surface-raised p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {meta}
          </pre>
          <p className="text-xs text-subtle-foreground">{t("social.export.metaHelp")}</p>
        </div>
      ) : null}
    </Panel>
  );
}
