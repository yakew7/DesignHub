"use client";

import { useState, type RefObject } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parsePaletteImport } from "@/lib/color/import-palette";
import { createSwatch, useColorStore } from "@/store/color-store";

type PaletteImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Import button, which gets focus back when the dialog closes. */
  triggerRef: RefObject<HTMLButtonElement | null>;
};

/** Paste a Coolors URL or hex codes to replace the palette. Loaded the first time it opens. */
export function PaletteImportDialog({ open, onOpenChange, triggerRef }: PaletteImportDialogProps) {
  const setSwatches = useColorStore((state) => state.setSwatches);
  const [importValue, setImportValue] = useState("");

  function importPalette() {
    const result = parsePaletteImport(importValue);

    if (result.colors.length < 2) {
      toast.error("Import at least 2 colors", {
        description: "Paste a Coolors URL or text containing 2 or more hex codes.",
      });
      return;
    }

    setSwatches(result.colors.map((color) => createSwatch(color)));
    setImportValue("");
    onOpenChange(false);

    if (result.dropped > 0) {
      toast.success("Palette imported", {
        description:
          "Imported 10 colors and dropped " +
          result.dropped +
          " extra " +
          (result.dropped === 1 ? "color." : "colors."),
      });
    } else {
      toast.success("Palette imported");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="palette-import"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Import palette</DialogTitle>
          <DialogDescription>Paste a Coolors URL or text containing hex codes.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={importValue}
          onChange={(event) => setImportValue(event.target.value)}
          placeholder="https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51"
          aria-label="Palette import value"
          rows={5}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={importPalette}>Import</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
