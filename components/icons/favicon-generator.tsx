"use client";

import { Download, FileArchive, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { IconImage } from "@/components/icons/icon-image";
import { CodeBlock } from "@/components/export/code-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { useIcon } from "@/hooks/use-icon-data";
import { downloadBlob } from "@/lib/download";
import { buildFaviconPackage, buildIco, faviconHtml, faviconStyle, type FaviconOptions } from "@/lib/icons/favicon";
import { useIconStore } from "@/store/icon-store";

const previewSizes = [16, 32, 48, 64, 180];

function BrowserTab({ dark, title, children }: { dark: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className={dark ? "rounded-lg bg-[#202124] p-2" : "rounded-lg bg-[#dee1e6] p-2"} aria-hidden>
      <div
        className={
          dark
            ? "flex h-9 w-56 items-center gap-2 rounded-t-lg bg-[#35363a] px-3 text-xs text-[#e8eaed]"
            : "flex h-9 w-56 items-center gap-2 rounded-t-lg bg-white px-3 text-xs text-[#202124]"
        }
      >
        {children}
        <span className="truncate">{title}</span>
      </div>
    </div>
  );
}

export function FaviconGenerator() {
  const { t } = useI18n();
  const selected = useIconStore((state) => state.selected);
  const baseStyle = useIconStore((state) => state.style);
  const icon = useIcon(selected);
  const [options, setOptions] = useState<FaviconOptions>({
    appName: "My App",
    themeColor: "#6366f1",
    backgroundColor: "#0e0e10",
  });
  const [busy, setBusy] = useState<"zip" | "ico" | null>(null);
  const style = faviconStyle(baseStyle, options.themeColor);

  async function run(kind: "zip" | "ico") {
    if (!icon) return;
    setBusy(kind);
    try {
      if (kind === "zip") {
        const zip = await buildFaviconPackage(icon, style, options);
        downloadBlob(new Blob([zip.slice().buffer], { type: "application/zip" }), "favicons.zip");
      } else {
        const ico = await buildIco(icon, style);
        downloadBlob(new Blob([ico.slice().buffer], { type: "image/x-icon" }), "favicon.ico");
      }
      toast.success(kind === "zip" ? t("icons.favicon.zipDone") : t("icons.favicon.icoDone", { file: "favicon.ico" }));
    } catch {
      toast.error(t("icons.favicon.failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel
        collapsible
        id="icons-favicon"
        defaultOpen={false}
        title={t("icons.favicon.preview")}
        description={t("icons.favicon.tip")}
      >
        {icon ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end gap-6">
              {previewSizes.map((size) => (
                <figure key={size} className="flex flex-col items-center gap-2">
                  <div className="bg-checker flex items-center justify-center rounded-md border p-2">
                    <IconImage icon={icon} style={{ ...style, size }} alt="" className="block" />
                  </div>
                  <figcaption className="font-mono text-[11px] text-subtle-foreground">{size}px</figcaption>
                </figure>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {[false, true].map((dark) => (
                <BrowserTab key={String(dark)} dark={dark} title={options.appName}>
                  <IconImage icon={icon} style={{ ...style, size: 16 }} alt="" className="size-4" />
                </BrowserTab>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-32 animate-pulse rounded-md bg-muted" />
        )}
      </Panel>

      <Panel title={t("icons.favicon.package")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="favicon-name">{t("icons.favicon.appName")}</Label>
            <Input
              id="favicon-name"
              value={options.appName}
              onChange={(event) => setOptions((current) => ({ ...current, appName: event.target.value }))}
            />
          </div>
          {(["themeColor", "backgroundColor"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={`favicon-${key}`}>
                {key === "themeColor" ? t("icons.favicon.themeColor") : t("icons.favicon.backgroundColor")}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id={`favicon-${key}`}
                  type="color"
                  value={options[key]}
                  onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
                />
                <span className="font-mono text-xs">{options[key]}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("icons.favicon.includes", {
            files: "favicon.ico (16/32/48), icon.svg, apple-touch-icon.png (180), icon-192.png, icon-512.png",
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run("zip")} disabled={!icon || busy !== null}>
            {busy === "zip" ? <Loader2 className="animate-spin" /> : <FileArchive />} {t("icons.favicon.zip")}
          </Button>
          <Button variant="outline" onClick={() => run("ico")} disabled={!icon || busy !== null}>
            {busy === "ico" ? <Loader2 className="animate-spin" /> : <Download />}{" "}
            {t("icons.favicon.icoOnly", { file: "favicon.ico" })}
          </Button>
        </div>
        <CodeBlock code={`${faviconHtml(options)}\n`} filename="favicon.html" />
      </Panel>
    </div>
  );
}
