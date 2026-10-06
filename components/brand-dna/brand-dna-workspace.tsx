"use client";

import { Check, ImageUp, Loader2, RotateCcw, Sparkles, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DnaResultEditor } from "@/components/brand-dna/dna-result-editor";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import { isTypingTarget } from "@/hooks/use-hotkeys";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { applyBrandDna } from "@/lib/brand-dna/apply";
import { ACCEPTED_IMAGES, loadDnaImage } from "@/lib/brand-dna/image";
import { dnaProviders, getDnaProvider } from "@/lib/brand-dna/registry";
import { dnaStages, MAX_DNA_IMAGES, type BrandDna, type DnaImage, type DnaStage } from "@/lib/brand-dna/types";
import { applySnapshot } from "@/lib/projects/snapshot";
import { cn } from "@/lib/utils";
import { useBrandDnaStore } from "@/store/brand-dna-store";

type Status = { kind: "idle" } | { kind: "running"; stage: DnaStage } | { kind: "error"; message: string };

export function BrandDnaWorkspace() {
  const providerId = useBrandDnaStore((state) => state.providerId);
  const setProvider = useBrandDnaStore((state) => state.setProvider);
  const ignoreBackground = useBrandDnaStore((state) => state.ignoreBackground);
  const setIgnoreBackground = useBrandDnaStore((state) => state.setIgnoreBackground);
  const provider = getDnaProvider(providerId);
  const providersRef = useRovingRadio<HTMLDivElement>();
  const [images, setImages] = useState<DnaImage[]>([]);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The latest images, for async uploads and the unmount cleanup.
  const imagesRef = useRef<DnaImage[]>([]);
  imagesRef.current = images;

  useEffect(
    () => () => {
      abortRef.current?.abort();
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [],
  );

  async function analyze(targets: DnaImage[], providerKey = providerId) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setDna(null);
    if (targets.length === 0) {
      setStatus({ kind: "idle" });
      return;
    }
    setStatus({ kind: "running", stage: "reading" });
    try {
      const result = await getDnaProvider(providerKey).analyze(targets, {
        signal: controller.signal,
        onStage: (stage) => setStatus({ kind: "running", stage }),
        ignoreBackground,
      });
      if (controller.signal.aborted) return;
      setDna(result);
      setStatus({ kind: "idle" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Analysis failed." });
    }
  }

  function replaceImages(next: DnaImage[]) {
    imagesRef.current = next;
    setImages(next);
    void analyze(next);
  }

  async function upload(files: File[]) {
    if (files.length === 0) return;
    const room = MAX_DNA_IMAGES - imagesRef.current.length;
    const messages: string[] = [];
    if (files.length > room) {
      messages.push(
        `You can combine up to ${MAX_DNA_IMAGES} images. ${
          room > 0 ? `Added the first ${room}. Remove` : "Remove"
        } one to add another.`,
      );
    }
    const loaded: DnaImage[] = [];
    for (const file of files.slice(0, Math.max(0, room))) {
      try {
        loaded.push({ ...(await loadDnaImage(file)), ignoreBackground });
      } catch (error) {
        messages.push(
          `${file.name}: ${error instanceof Error ? error.message : "This browser couldn't read that image."}`,
        );
      }
    }
    setNotice(messages.length > 0 ? messages.join(" ") : null);
    if (loaded.length === 0) return;
    // Another upload may have finished meanwhile; never go over the limit.
    const current = imagesRef.current;
    const fits = loaded.slice(0, Math.max(0, MAX_DNA_IMAGES - current.length));
    loaded.slice(fits.length).forEach((item) => URL.revokeObjectURL(item.url));
    if (fits.length > 0) replaceImages([...current, ...fits]);
  }

  function remove(id: string) {
    const target = images.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setNotice(null);
    replaceImages(images.filter((item) => item.id !== id));
  }

  function setImageBackground(id: string, value: boolean) {
    // The last choice becomes the default for the next upload.
    setIgnoreBackground(value);
    replaceImages(images.map((item) => (item.id === id ? { ...item, ignoreBackground: value } : item)));
  }

  // Paste an image from the clipboard anywhere on the page (except while typing in a field).
  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const file =
        [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith("image/")) ??
        [...(event.clipboardData?.items ?? [])]
          .find((item) => item.kind === "file" && item.type.startsWith("image/"))
          ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void uploadRef.current([file]);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function apply() {
    if (!dna) return;
    const before = applyBrandDna(dna);
    toast.success("Brand DNA applied", {
      description: "Palette, fonts, radius and personality were updated.",
      action: { label: "Undo", onClick: () => applySnapshot(before) },
    });
  }

  const running = status.kind === "running";
  const stageIndex = running ? dnaStages.findIndex((stage) => stage.id === status.stage) : -1;

  return (
    <StudioLayout
      id="brand-dna"
      controls={
        <>
          <Panel
            title="Source images"
            description={`A logo, product shot or up to ${MAX_DNA_IMAGES} moodboard images, combined by area. They never leave your device.`}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void upload([...event.dataTransfer.files]);
              }}
              className={cn(
                "flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
                dragging && "border-brand bg-brand/5 text-foreground",
              )}
            >
              <ImageUp className="size-5" />
              <span>
                {images.length === 0
                  ? "Drop, paste or click to upload"
                  : `Add images (${images.length} of ${MAX_DNA_IMAGES})`}
              </span>
              <span className="text-[11px] text-subtle-foreground">PNG, JPEG, WebP, GIF, AVIF or SVG, up to 10 MB</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_IMAGES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-label="Source images"
              onChange={(event) => {
                void upload([...(event.target.files ?? [])]);
                event.target.value = "";
              }}
            />
            {notice ? (
              <p role="alert" className="flex items-start gap-2 text-xs text-destructive">
                <TriangleAlert className="mt-px size-3.5 shrink-0" /> {notice}
              </p>
            ) : null}
            {images.length > 0 ? (
              <ul aria-label="Uploaded images" className="flex flex-col gap-2">
                {images.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-md border p-2">
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-checker">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                      <img src={item.url} alt="" className="max-h-full max-w-full object-contain" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="truncate text-xs font-medium" title={item.name}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`dna-ignore-${item.id}`}
                          checked={item.ignoreBackground ?? ignoreBackground}
                          onCheckedChange={(value) => setImageBackground(item.id, value)}
                        />
                        <Label htmlFor={`dna-ignore-${item.id}`} className="text-[11px] font-normal whitespace-nowrap">
                          Ignore background
                        </Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => remove(item.id)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            {images.length > 0 ? (
              <p className="text-[11px] text-subtle-foreground">
                Ignore background leaves a flat backdrop, like the white behind a logo, out of that image&apos;s
                palette.
              </p>
            ) : null}
          </Panel>
          <Panel title="Provider">
            <div ref={providersRef} role="radiogroup" aria-label="Analysis provider" className="flex flex-col gap-1.5">
              {dnaProviders.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={item.id === provider.id}
                  onClick={() => {
                    setProvider(item.id);
                    if (images.length > 0) void analyze(images, item.id);
                  }}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border p-2.5 text-left transition-colors duration-150 hover:border-border-strong",
                    item.id === provider.id && "border-brand/60 bg-surface-raised",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {item.label}
                    {item.local ? <Badge variant="success">Private</Badge> : null}
                    {item.mocked ? <Badge variant="warning">Sample data</Badge> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </button>
              ))}
            </div>
          </Panel>
        </>
      }
      preview={
        <div className="flex min-h-80 flex-1 flex-col gap-4 rounded-lg border bg-surface-raised p-4">
          {images.length > 0 ? (
            <div className={cn("grid min-h-0 flex-1 gap-2", images.length > 1 && "grid-cols-2 sm:grid-cols-3")}>
              {images.map((item) => (
                <div
                  key={item.id}
                  className="relative flex min-h-24 items-center justify-center overflow-hidden rounded-md bg-checker"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                  <img src={item.url} alt={`Uploaded ${item.name}`} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Sparkles className="size-6 text-brand" />
              <p className="max-w-sm">
                Upload an image to extract its colors, mood and a matching type pairing, then apply them to your brand.
              </p>
            </div>
          )}
          {running ? (
            <ol aria-live="polite" aria-label="Analysis progress" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {dnaStages.map((stage, i) => (
                <li
                  key={stage.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs text-muted-foreground",
                    i === stageIndex && "border-brand/60 text-foreground",
                  )}
                >
                  {i < stageIndex ? (
                    <Check className="size-3.5 text-success" />
                  ) : i === stageIndex ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="size-3.5 rounded-full border" />
                  )}
                  {stage.label}
                </li>
              ))}
            </ol>
          ) : null}
          {dna ? (
            <div className="flex flex-col gap-2">
              <div className="flex h-12 overflow-hidden rounded-md border" aria-label="Extracted palette" role="img">
                {dna.colors.map((color, i) => (
                  <span key={i} style={{ background: color.hex, flexGrow: Math.max(0.08, color.weight) }} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {dna.mood} · {Math.round(dna.confidence * 100)}% confidence · {dna.notes.join(" ")}
              </p>
            </div>
          ) : null}
          {status.kind === "error" ? (
            <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
              <TriangleAlert className="size-4" /> {status.message}
            </p>
          ) : null}
        </div>
      }
      output={
        <>
          <h2 className="text-sm font-medium">Brand DNA</h2>
          {dna ? (
            <>
              <DnaResultEditor dna={dna} onChange={setDna} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={apply}>
                  <Sparkles /> Apply to brand
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Analyze again"
                  onClick={() => void analyze(images)}
                  disabled={images.length === 0 || running}
                >
                  <RotateCcw />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {running ? "Analyzing..." : "Results appear here, ready to edit before you apply them."}
            </p>
          )}
        </>
      }
    />
  );
}
