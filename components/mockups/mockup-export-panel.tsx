"use client";

import { ClipboardCopy, FileText, ImageDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadBlob } from "@/lib/download";
import { imagesToPdf } from "@/lib/export/pdf";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { svgDimensions } from "@/lib/svg-size";
import { useMockupStore } from "@/store/mockup-store";

/** `signature` is set for the email signature mockup: the HTML version to paste into a mail client. */
type Props = { svg: string; name: string; label: string; signature?: string };

export function MockupExportPanel({ svg, name, label, signature }: Props) {
  const { t } = useI18n();
  const scale = useMockupStore((state) => state.scale);
  const setScale = useMockupStore((state) => state.setScale);
  const [busy, setBusy] = useState<"png" | "webp" | "pdf" | null>(null);
  const { width, height } = svgDimensions(svg);
  const file = `${slugify(name)}-${slugify(label)}`;

  async function run(kind: "png" | "webp" | "pdf") {
    setBusy(kind);
    try {
      if (kind === "webp") {
        const image = await rasterize(svg, scale, 8192, "webp");
        downloadBlob(new Blob([image.bytes.slice().buffer], { type: "image/webp" }), `${file}@${scale}x.webp`);
        toast.success(t("command.downloadReady"));
        return;
      }
      const image = await rasterize(svg, scale);
      if (kind === "png")
        downloadBlob(new Blob([image.bytes.slice().buffer], { type: "image/png" }), `${file}@${scale}x.png`);
      else {
        const pdf = await imagesToPdf([{ image }], { title: `${name} ${label}`, scale });
        downloadBlob(new Blob([pdf.slice().buffer], { type: "application/pdf" }), `${file}.pdf`);
      }
      toast.success(t("command.downloadReady"));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("command.exportFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function copySignature() {
    if (!signature) return;
    try {
      // Rich HTML pastes as a formatted signature; plain text is the fallback for editors that want code.
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([signature], { type: "text/html" }),
            "text/plain": new Blob([signature], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(signature);
      }
      toast.success(t("mockups.export.signatureCopied"), { description: t("mockups.export.signatureCopiedHint") });
    } catch {
      toast.error(t("mockups.export.copyFailed"));
    }
  }

  return (
    <>
      <h2 className="text-sm font-medium">{t("mockups.export.title")}</h2>
      <div className="flex flex-col gap-2">
        <Label>{t("mockups.export.resolution")}</Label>
        <ToggleGroup
          type="single"
          value={String(scale)}
          onValueChange={(value) => value && setScale(Number(value))}
          aria-label={t("mockups.export.resolutionLabel")}
          className="w-full"
        >
          {[1, 2, 3, 4].map((value) => (
            <ToggleGroupItem key={value} value={String(value)} className="flex-1 font-mono">
              {value}×
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="font-mono text-[11px] text-subtle-foreground">
          {Math.round(width * scale)} × {Math.round(height * scale)} px
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => run("png")} disabled={!svg || busy !== null}>
          {busy === "png" ? <Loader2 className="animate-spin" /> : <ImageDown />} PNG
        </Button>
        <Button variant="outline" onClick={() => run("webp")} disabled={!svg || busy !== null}>
          {busy === "webp" ? <Loader2 className="animate-spin" /> : <ImageDown />} WebP
        </Button>
        <Button variant="outline" onClick={() => run("pdf")} disabled={!svg || busy !== null}>
          {busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />} PDF
        </Button>
      </div>
      {signature ? (
        <div className="flex flex-col gap-2 border-t pt-4">
          <Label>{t("mockups.export.signature")}</Label>
          <Button variant="outline" onClick={copySignature}>
            <ClipboardCopy /> {t("mockups.export.copySignature")}
          </Button>
          <p className="text-[11px] text-subtle-foreground">{t("mockups.export.signatureHelp")}</p>
        </div>
      ) : null}
    </>
  );
}
