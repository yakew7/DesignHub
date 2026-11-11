"use client";

import { ClipboardPaste, FileCode2, RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, LocalizedError } from "@/lib/i18n/errors";
import { readSvgFile } from "@/lib/svg/read-file";
import { byteLength, formatBytes } from "@/lib/svg-size";
import { useSvgStore } from "@/store/svg-store";

export function SvgDocumentPanel() {
  const { t } = useI18n();
  const name = useSvgStore((state) => state.name);
  const source = useSvgStore((state) => state.source);
  const setDocument = useSvgStore((state) => state.setDocument);
  const setSource = useSvgStore((state) => state.setSource);
  const loadSample = useSvgStore((state) => state.loadSample);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      setDocument(file.name, await readSvgFile(file));
      toast.success(t("svg.file.loaded", { name: file.name }));
    } catch (error) {
      toast.error(errorMessage(error, t, "svg.file.unreadable"));
    }
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.includes("<svg")) throw new LocalizedError("svg.clipboard.noSvg");
      setDocument("pasted.svg", text);
    } catch (error) {
      toast.error(errorMessage(error, t, "svg.clipboard.unavailable"));
    }
  }

  return (
    <Panel
      title={t("svg.tab.document")}
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("svg.document.loadSample")}
          title={t("svg.document.loadSample")}
          onClick={loadSample}
        >
          <RotateCcw />
        </Button>
      }
    >
      <div className="flex items-center gap-2 rounded-md border bg-surface px-3 py-2">
        <FileCode2 className="size-4 text-brand" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{name}</span>
        <span className="font-mono text-[11px] text-subtle-foreground">{formatBytes(byteLength(source))}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload /> {t("svg.document.upload")}
        </Button>
        <Button variant="outline" size="sm" onClick={paste}>
          <ClipboardPaste /> {t("svg.document.paste")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("svg.document.fileLabel")}
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <label htmlFor="svg-source" className="text-xs font-medium text-muted-foreground">
        {t("svg.document.source")}
      </label>
      <Textarea
        id="svg-source"
        value={source}
        onChange={(event) => setSource(event.target.value)}
        spellCheck={false}
        className="min-h-48 font-mono text-[11px] leading-relaxed scrollbar-thin"
      />
      <p className="text-[11px] text-subtle-foreground">{t("svg.document.dropHint")}</p>
    </Panel>
  );
}
