"use client";

import { Upload } from "lucide-react";
import { useState, type DragEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { errorMessage } from "@/lib/i18n/errors";
import { readSvgFile } from "@/lib/svg/read-file";
import { cn } from "@/lib/utils";

type SvgDropzoneProps = {
  onLoad: (name: string, source: string) => void;
  children: ReactNode;
};

/** Accepts SVG files dropped anywhere on the preview. */
export function SvgDropzone({ onLoad, children }: SvgDropzoneProps) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    try {
      onLoad(file.name, await readSvgFile(file));
      toast.success(t("svg.file.loaded", { name: file.name }));
    } catch (error) {
      toast.error(errorMessage(error, t, "svg.file.unreadable"));
    }
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {children}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand bg-background/85 text-sm font-medium opacity-0 transition-opacity duration-150",
          dragging && "opacity-100",
        )}
      >
        <Upload className="size-6 text-brand" />
        {t("svg.dropzone.hint")}
      </div>
    </div>
  );
}
