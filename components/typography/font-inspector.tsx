"use client";

import { FileType2, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { describeFeature } from "@/lib/typography/opentype-features";
import { inspectFont, isInspectableFont, registerLocalFont, type FontInspection } from "@/lib/typography/inspect-font";
import { cn } from "@/lib/utils";
import { useTypographyStore } from "@/store/typography-store";

/** Drop a local font to read its real OpenType feature list and preview it. Nothing is uploaded. */
export function FontInspector() {
  const setActiveFont = useTypographyStore((state) => state.setActiveFont);
  const [result, setResult] = useState<FontInspection | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    if (!isInspectableFont(file)) {
      toast.error("Unsupported file", { description: "Use an .otf, .ttf or .woff font." });
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const inspection = await inspectFont(buffer, file.name.replace(/\.[^.]+$/, ""));
      await registerLocalFont(buffer.slice(0), inspection.family);
      setResult(inspection);
      setActiveFont(inspection.family);
      toast.success(`Loaded ${inspection.family}`, { description: "Previewing locally. Nothing was uploaded." });
    } catch {
      toast.error("Could not read that font file.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handle(event.dataTransfer.files[0]);
  }

  return (
    <Panel
      advanced
      collapsible
      id="typography-inspector"
      defaultOpen={false}
      title="Font inspector"
      description="Inspect a local font file with OpenType.js. It never leaves your device."
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-md border border-dashed p-6 text-center transition-colors duration-150",
          dragging && "border-brand bg-brand/5",
        )}
      >
        <Upload className="size-5 text-subtle-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Drop an .otf, .ttf or .woff file</p>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Reading…" : "Choose file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".otf,.ttf,.woff,font/otf,font/ttf,font/woff"
          className="sr-only"
          tabIndex={-1}
          aria-label="Font file"
          onChange={(event) => void handle(event.target.files?.[0])}
        />
      </div>
      {result ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileType2 className="size-4 text-brand" aria-hidden />
            <p className="text-sm font-medium">
              {result.family} <span className="text-muted-foreground">{result.subfamily}</span>
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-xs">
            {[
              ["Glyphs", result.glyphs],
              ["Units/em", result.unitsPerEm],
              ["Axes", result.axes.length || "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted px-2 py-1.5">
                <dt className="text-subtle-foreground">{label}</dt>
                <dd className="font-mono tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="flex flex-wrap gap-1.5" aria-label="Supported features">
            {result.features.length ? (
              result.features.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline" title={describeFeature(tag)}>
                    <code className="font-mono">{tag}</code>
                  </Badge>
                </li>
              ))
            ) : (
              <li className="text-xs text-muted-foreground">No layout features found.</li>
            )}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}
