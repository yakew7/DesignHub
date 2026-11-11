"use client";

import { FileArchive, FileJson, FileText, ImageDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import { toast } from "@/lib/toast";

import { ExportPanel } from "@/components/export/export-panel";
import { Button } from "@/components/ui/button";
import { downloadBlob, downloadDataUrl, downloadText } from "@/lib/download";
import { tokenFormat, tokenFormatList, tokenFormats } from "@/lib/tokens/formats";
import { createZip } from "@/lib/zip";
import { useTokensStore } from "@/store/tokens-store";
import type { DesignTokens } from "@/types/tokens";

type Action = "zip" | "png" | "pdf";

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "design-tokens"
  );
}

async function snapshot(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  // If web fonts can't be inlined (offline, blocked), fall back to a capture without them.
  return toPng(node, { pixelRatio: 2 }).catch(() => toPng(node, { pixelRatio: 2, skipFonts: true }));
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.split(",")[1] ?? "");
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function TokenOutput({
  tokens,
  previewRef,
}: {
  tokens: DesignTokens;
  previewRef: RefObject<HTMLDivElement | null>;
}) {
  // The list is cheap; code is written for the open format only, and for everything when the ZIP is asked for.
  const formats = useMemo(() => tokenFormatList(tokens), [tokens]);
  const renderCode = useCallback((id: string) => tokenFormat(tokens, id)?.code ?? "", [tokens]);
  const openFormat = useTokensStore((state) => state.openFormat);
  const setOpenFormat = useTokensStore((state) => state.setOpenFormat);
  const [busy, setBusy] = useState<Action | null>(null);

  // `/export?format=css` opens that format, once the saved choice has loaded so the link wins over it.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("format");
    if (!wanted || !formats.some((format) => format.id === wanted)) return;
    const apply = () => setOpenFormat(wanted);
    if (useTokensStore.persist.hasHydrated()) return apply();
    return useTokensStore.persist.onFinishHydration(apply);
    // Only on arrival: later edits to the tokens must not reopen the linked format.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const name = slug(tokens.meta.name);

  async function run(action: Action) {
    setBusy(action);
    try {
      if (action === "zip") {
        // React and Vue both export theme.ts; files that share a name go in a folder per format.
        const all = tokenFormats(tokens);
        const shared = (filename: string) => all.filter((item) => item.filename === filename).length > 1;
        const zip = createZip(
          all.map((format) => ({
            name: shared(format.filename) ? `${format.id}/${format.filename}` : format.filename,
            data: format.code,
          })),
        );
        downloadBlob(new Blob([zip.slice().buffer], { type: "application/zip" }), `${name}-tokens.zip`);
      }
      if (action === "png" && previewRef.current) {
        downloadDataUrl(await snapshot(previewRef.current), `${name}-preview.png`);
      }
      if (action === "pdf") {
        const { buildStyleGuidePdf } = await import("@/lib/tokens/pdf");
        const image = previewRef.current ? dataUrlToBytes(await snapshot(previewRef.current)) : undefined;
        const pdf = await buildStyleGuidePdf(tokens, image);
        downloadBlob(new Blob([pdf.slice().buffer], { type: "application/pdf" }), `${name}-style-guide.pdf`);
      }
      toast.success("Download ready");
    } catch {
      toast.error("Export failed", { description: "Try again, or copy the code directly." });
    } finally {
      setBusy(null);
    }
  }

  const spinner = (action: Action) => (busy === action ? <Loader2 className="animate-spin" /> : null);

  return (
    <section aria-labelledby="output-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="output-title" className="text-lg font-medium">
          Output
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadText(tokenFormat(tokens, "json")?.code ?? "", `${name}.tokens.json`)}>
            <FileJson /> Download JSON
          </Button>
          <Button variant="outline" onClick={() => run("zip")} disabled={busy !== null}>
            {spinner("zip") ?? <FileArchive />} All formats (.zip)
          </Button>
          <Button variant="outline" onClick={() => run("png")} disabled={busy !== null}>
            {spinner("png") ?? <ImageDown />} Preview PNG
          </Button>
          <Button variant="outline" onClick={() => run("pdf")} disabled={busy !== null}>
            {spinner("pdf") ?? <FileText />} Style guide PDF
          </Button>
        </div>
      </div>
      <ExportPanel
        formats={formats}
        renderCode={renderCode}
        label="Token format"
        activeId={formats.some((format) => format.id === openFormat) ? openFormat : (formats[0]?.id ?? null)}
        onActiveChange={setOpenFormat}
        linkPath={(id) => `/export?format=${encodeURIComponent(id)}`}
      />
    </section>
  );
}
