"use client";

import "@/lib/i18n/areas/projects";

import { useMemo, useState, type RefObject } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { previewEntries, type ProjectEntry } from "@/lib/projects/transfer";
import { formatBytes } from "@/lib/svg-size";

type Props = {
  /** The projects of the file, or null while no file is waiting. */
  entries: ProjectEntry[] | null;
  onCancel: () => void;
  /** Called with the projects that were left checked, in the order of the file. */
  onImport: (chosen: ProjectEntry[]) => void;
  /** Gets focus back on close when the opener (a menu item) is gone. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
};

function Choices({ entries, onCancel, onImport }: Omit<Props, "entries" | "triggerRef"> & { entries: ProjectEntry[] }) {
  const { t, plural } = useI18n();
  const previews = useMemo(() => previewEntries(entries), [entries]);
  const [chosen, setChosen] = useState<ReadonlySet<number>>(() => new Set(entries.map((_, index) => index)));
  const all = chosen.size === entries.length;

  const toggle = (index: number) =>
    setChosen((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (chosen.size > 0) onImport(entries.filter((_, index) => chosen.has(index)));
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("projects.importPreview.title")}</DialogTitle>
        <DialogDescription>{plural("projects.importPreview.description", entries.length)}</DialogDescription>
      </DialogHeader>
      <ul
        aria-label={t("projects.importPreview.list")}
        className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-lg border"
      >
        {previews.map((preview, index) => (
          <li key={index}>
            <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-surface-raised">
              <input
                type="checkbox"
                checked={chosen.has(index)}
                onChange={() => toggle(index)}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--brand)]"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{preview.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[
                    ...(preview.tags.length ? [preview.tags.join(", ")] : []),
                    plural("projects.importPreview.versions", preview.versions),
                    formatBytes(preview.bytes),
                  ].join(" · ")}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setChosen(all ? new Set() : new Set(entries.keys()))}
        >
          {t(all ? "projects.importPreview.selectNone" : "projects.importPreview.selectAll")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={chosen.size === 0}>
            {plural("projects.importPreview.submit", chosen.size)}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Shown for a file that holds more than one project: a checkbox for each (name, tags, versions, size), all checked,
 * and only the checked ones are imported. Nothing is written to the browser's storage until it is confirmed.
 */
export function ProjectImportDialog({ entries, onCancel, onImport, triggerRef }: Props) {
  return (
    <Dialog open={entries !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (!triggerRef) return;
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        {entries ? <Choices entries={entries} onCancel={onCancel} onImport={onImport} /> : null}
      </DialogContent>
    </Dialog>
  );
}
