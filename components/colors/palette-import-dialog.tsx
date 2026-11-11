"use client";

import { useState, type RefObject } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
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
  const { t, plural } = useI18n();
  const setSwatches = useColorStore((state) => state.setSwatches);
  const [importValue, setImportValue] = useState("");

  function importPalette() {
    const result = parsePaletteImport(importValue);

    if (result.colors.length < 2) {
      toast.error(t("colors.import.tooFew"), { description: t("colors.import.tooFewDescription") });
      return;
    }

    setSwatches(result.colors.map((color) => createSwatch(color)));
    setImportValue("");
    onOpenChange(false);

    if (result.dropped > 0) {
      toast.success(t("colors.import.done"), {
        description: plural("colors.import.dropped", result.dropped, { kept: result.colors.length }),
      });
    } else {
      toast.success(t("colors.import.done"));
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
          <DialogTitle>{t("colors.import.title")}</DialogTitle>
          <DialogDescription>{t("colors.import.description")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={importValue}
          onChange={(event) => setImportValue(event.target.value)}
          placeholder="https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51"
          aria-label={t("colors.import.value")}
          rows={5}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">{t("common.cancel")}</Button>
          </DialogClose>
          <Button onClick={importPalette}>{t("common.import")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
