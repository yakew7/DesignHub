"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Download, MoreHorizontal, Pipette, Plus, Redo2, Shuffle, Undo2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkeys";
import { fromEyeDropperResult } from "@/lib/color/eyedropper";
import { randomColor } from "@/lib/color/generate";
import { paletteNames } from "@/lib/color/names";
import { createId } from "@/lib/id";
import { useLibraryStore } from "@/store/library-store";
import { MAX_SWATCHES, useColorStore } from "@/store/color-store";
import type { Oklch, Swatch } from "@/types/color";

const loadImportDialog = () => import("@/components/colors/palette-import-dialog").then((m) => m.PaletteImportDialog);

// The import dialog (a modal) loads the first time it's opened, not with the page.
const PaletteImportDialog = dynamic(loadImportDialog, { ssr: false });

type EyeDropperResult = { sRGBHex: string };
type EyeDropperConstructor = new () => { open: () => Promise<EyeDropperResult> };
type EyeDropperWindow = Window & { EyeDropper?: EyeDropperConstructor };

type PaletteAnnouncementKind = "generated" | "loaded";
export type PaletteAnnouncer = (kind: PaletteAnnouncementKind, swatches: Swatch[]) => void;

export function usePaletteAnnouncement() {
  const { t, plural } = useI18n();
  const [message, setMessage] = useState("");
  const announce = useCallback<PaletteAnnouncer>(
    (kind, swatches) => {
      const names = paletteNames(swatches.map((swatch) => swatch.color)).join(", ");
      const announcement =
        kind === "generated"
          ? t("colors.announcement.generated", { names })
          : t("colors.announcement.loaded", { names });
      const lockedCount = kind === "generated" ? swatches.filter((swatch) => swatch.locked).length : 0;
      const completeMessage =
        lockedCount > 0 ? `${announcement} ${plural("colors.announcement.locked", lockedCount)}` : announcement;

      // Clear first so repeating the same palette is still a live-region change.
      setMessage("");
      window.setTimeout(() => setMessage(completeMessage), 0);
    },
    [plural, t],
  );

  return { announce, message };
}

type PaletteToolbarProps = {
  /** Supplies colors for the next generation (harmony modes). */
  nextColors?: () => Oklch[];
  announce: PaletteAnnouncer;
};

export function PaletteToolbar({ nextColors, announce }: PaletteToolbarProps) {
  const { t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const selectedId = useColorStore((state) => state.selectedId);
  const generate = useColorStore((state) => state.generate);
  const undo = useColorStore((state) => state.undo);
  const redo = useColorStore((state) => state.redo);
  const addSwatch = useColorStore((state) => state.addSwatch);
  const canUndo = useColorStore((state) => state.past.length > 0);
  const canRedo = useColorStore((state) => state.future.length > 0);
  const savePalette = useLibraryStore((state) => state.savePalette);
  const [menuOpen, setMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMounted, setImportMounted] = useState(false);
  const [eyeDropperAvailable, setEyeDropperAvailable] = useState(false);
  // The import dialog returns focus to the menu button, which stays when the menu closes.
  const moreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setEyeDropperAvailable(
      typeof window !== "undefined" && typeof (window as EyeDropperWindow).EyeDropper === "function",
    );
  }, []);

  const run = () => {
    generate(nextColors?.());
    announce("generated", useColorStore.getState().swatches);
  };
  useHotkey("space", run);
  useHotkey("z", undo);
  useHotkey("shift+z", redo);

  async function pickColor() {
    setMenuOpen(false);
    const EyeDropperApi = (window as EyeDropperWindow).EyeDropper;
    if (!EyeDropperApi || swatches.length >= MAX_SWATCHES) return;

    try {
      const result = await new EyeDropperApi().open();
      addSwatch(fromEyeDropperResult(result), selectedId ?? undefined);
    } catch {
      return;
    }
  }

  function save() {
    setMenuOpen(false);
    const colors = swatches.map((swatch) => swatch.color);
    const name = paletteNames(colors).slice(0, 3).join(" · ");
    savePalette({ id: createId("pal"), name, colors, createdAt: Date.now() });
    toast.success(t("colors.toolbar.saved"), { description: t("colors.toolbar.savedDescription") });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={t("colors.toolbar.label")}>
      <Button onClick={run}>
        <Shuffle /> {t("colors.toolbar.generate")}
        <Kbd className="border-transparent bg-primary-foreground/15 text-primary-foreground">
          {t("colors.toolbar.space")}
        </Kbd>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} aria-label={t("common.undo")}>
            <Undo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("colors.toolbar.undoHint")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            aria-label={t("colors.toolbar.redo")}
          >
            <Redo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("colors.toolbar.redoHint")}</TooltipContent>
      </Tooltip>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={moreRef}
            variant="outline"
            onPointerEnter={() => void loadImportDialog()}
            onFocus={() => void loadImportDialog()}
          >
            <MoreHorizontal /> {t("colors.toolbar.more")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-56 flex-col gap-1 p-1.5">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              addSwatch(randomColor(), selectedId ?? undefined);
              setMenuOpen(false);
            }}
            disabled={swatches.length >= MAX_SWATCHES}
          >
            <Plus /> {t("colors.toolbar.add")}
          </Button>
          {eyeDropperAvailable ? (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={pickColor}
              disabled={swatches.length >= MAX_SWATCHES}
            >
              <Pipette /> {t("colors.toolbar.eyedropper")}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="justify-start"
            aria-haspopup="dialog"
            onClick={() => {
              setMenuOpen(false);
              setImportMounted(true);
              setImportOpen(true);
            }}
          >
            <Download /> {t("common.import")}
          </Button>
          <Button variant="ghost" className="justify-start" onClick={save}>
            <Bookmark /> {t("common.save")}
          </Button>
        </PopoverContent>
      </Popover>
      {importMounted ? (
        <PaletteImportDialog open={importOpen} onOpenChange={setImportOpen} triggerRef={moreRef} />
      ) : null}
      <p className="ml-auto hidden text-xs text-subtle-foreground md:block">{t("colors.toolbar.lockTip")}</p>
    </div>
  );
}
