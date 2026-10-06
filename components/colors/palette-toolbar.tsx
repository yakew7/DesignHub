"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Bookmark, Download, Plus, Redo2, Shuffle, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkeys";
import { randomColor } from "@/lib/color/generate";
import { paletteNames } from "@/lib/color/names";
import { createId } from "@/lib/id";
import { useLibraryStore } from "@/store/library-store";
import { MAX_SWATCHES, useColorStore } from "@/store/color-store";
import type { Oklch } from "@/types/color";

const loadImportDialog = () => import("@/components/colors/palette-import-dialog").then((m) => m.PaletteImportDialog);

// The import dialog (a modal) loads the first time it's opened, not with the page.
const PaletteImportDialog = dynamic(loadImportDialog, { ssr: false });

type PaletteToolbarProps = {
  /** Supplies colors for the next generation (harmony modes). */
  nextColors?: () => Oklch[];
};

export function PaletteToolbar({ nextColors }: PaletteToolbarProps) {
  const swatches = useColorStore((state) => state.swatches);
  const selectedId = useColorStore((state) => state.selectedId);
  const generate = useColorStore((state) => state.generate);
  const undo = useColorStore((state) => state.undo);
  const redo = useColorStore((state) => state.redo);
  const addSwatch = useColorStore((state) => state.addSwatch);
  const canUndo = useColorStore((state) => state.past.length > 0);
  const canRedo = useColorStore((state) => state.future.length > 0);
  const savePalette = useLibraryStore((state) => state.savePalette);
  const [importOpen, setImportOpen] = useState(false);
  const [importMounted, setImportMounted] = useState(false);
  const importRef = useRef<HTMLButtonElement>(null);

  const run = () => generate(nextColors?.());
  useHotkey("space", run);
  useHotkey("z", undo);
  useHotkey("shift+z", redo);

  function save() {
    const colors = swatches.map((swatch) => swatch.color);
    const name = paletteNames(colors).slice(0, 3).join(" · ");
    savePalette({ id: createId("pal"), name, colors, createdAt: Date.now() });
    toast.success("Palette saved", { description: "Stored locally in your browser." });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Palette actions">
      <Button onClick={run}>
        <Shuffle /> Generate
        <Kbd className="border-transparent bg-primary-foreground/15 text-primary-foreground">Space</Kbd>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
            <Undo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo · Z</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
            <Redo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo · ⇧Z</TooltipContent>
      </Tooltip>
      <Button
        variant="outline"
        onClick={() => addSwatch(randomColor(), selectedId ?? undefined)}
        disabled={swatches.length >= MAX_SWATCHES}
      >
        <Plus /> Add color
      </Button>
      <Button
        ref={importRef}
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={importOpen}
        aria-controls={importOpen ? "palette-import" : undefined}
        data-state={importOpen ? "open" : "closed"}
        onPointerEnter={() => void loadImportDialog()}
        onFocus={() => void loadImportDialog()}
        onClick={() => {
          setImportMounted(true);
          setImportOpen(true);
        }}
      >
        <Download /> Import
      </Button>
      {importMounted ? (
        <PaletteImportDialog open={importOpen} onOpenChange={setImportOpen} triggerRef={importRef} />
      ) : null}
      <Button variant="outline" onClick={save}>
        <Bookmark /> Save
      </Button>
      <p className="ml-auto hidden text-xs text-subtle-foreground md:block">
        Lock colors to keep them between generations.
      </p>
    </div>
  );
}
