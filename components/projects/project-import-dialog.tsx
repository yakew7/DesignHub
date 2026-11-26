"use client";

import "@/lib/i18n/areas/projects";

import { useMemo, useState, type RefObject } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { chosenImports, type EntryMatch, type ImportChoice } from "@/lib/projects/import-match";
import { previewEntries, type ProjectEntry } from "@/lib/projects/transfer";
import { formatBytes } from "@/lib/svg-size";

type Props = {
  /** The projects of the file, or null while no file is waiting. */
  entries: ProjectEntry[] | null;
  /** For each project of the file, the stored project it already is, or null for a new one. */
  matches: readonly (EntryMatch | null)[];
  onCancel: () => void;
  /** Called with what was chosen, in the order of the file: new projects left checked, and stored ones set to Replace. */
  onImport: (chosen: ImportChoice[]) => void;
  /** Gets focus back on close when the opener (a menu item) is gone. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
};

const flip = (current: ReadonlySet<number>, index: number): Set<number> => {
  const next = new Set(current);
  if (!next.delete(index)) next.add(index);
  return next;
};

function Choices({
  entries,
  matches,
  onCancel,
  onImport,
}: Omit<Props, "entries" | "triggerRef"> & { entries: ProjectEntry[] }) {
  const { t, plural } = useI18n();
  const previews = useMemo(() => previewEntries(entries), [entries]);
  // A new project starts checked. One that is already here starts on Skip, so it imports nothing until Replace is chosen.
  const fresh = useMemo(() => entries.flatMap((_, index) => (matches[index] ? [] : [index])), [entries, matches]);
  const [chosen, setChosen] = useState<ReadonlySet<number>>(() => new Set(fresh));
  const [replacing, setReplacing] = useState<ReadonlySet<number>>(() => new Set());
  const all = fresh.every((index) => chosen.has(index));
  const count = chosen.size + replacing.size;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (count > 0) onImport(chosenImports(entries, matches, chosen, replacing));
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
        {previews.map((preview, index) => {
          const details = [
            ...(preview.tags.length ? [preview.tags.join(", ")] : []),
            plural("projects.importPreview.versions", preview.versions),
            formatBytes(preview.bytes),
          ].join(" · ");
          if (!matches[index]) {
            return (
              <li key={index}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-surface-raised">
                  <input
                    type="checkbox"
                    checked={chosen.has(index)}
                    onChange={() => setChosen((current) => flip(current, index))}
                    className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--brand)]"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{preview.name}</span>
                    <span className="text-xs text-muted-foreground">{details}</span>
                  </span>
                </label>
              </li>
            );
          }
          return (
            <li key={index} className="flex flex-col gap-1.5 px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{preview.name}</span>
                <span className="shrink-0 rounded-full border bg-surface-raised px-2 py-0.5 text-xs font-medium">
                  {t("projects.importPreview.alreadyHere")}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{details}</span>
              <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <legend className="sr-only">{t("projects.importPreview.choice", { name: preview.name })}</legend>
                {(["skip", "replace"] as const).map((choice) => (
                  <label key={choice} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`import-choice-${index}`}
                      checked={replacing.has(index) === (choice === "replace")}
                      onChange={() => setReplacing((current) => flip(current, index))}
                      className="size-4 cursor-pointer accent-[var(--brand)]"
                    />
                    {t(choice === "skip" ? "projects.importPreview.skip" : "projects.importPreview.replace")}
                  </label>
                ))}
              </fieldset>
              <p className="text-xs text-muted-foreground">{t("projects.importPreview.replaceHint")}</p>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={fresh.length === 0}
          onClick={() => {
            setChosen(all ? new Set() : new Set(fresh));
            if (all) setReplacing(new Set());
          }}
        >
          {t(all ? "projects.importPreview.selectNone" : "projects.importPreview.selectAll")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={count === 0}>
            {plural("projects.importPreview.submit", count)}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Shown for a file that holds more than one project, or one that is already here: a checkbox for each new project
 * (name, tags, versions, size), all checked, and only the checked ones are imported. A project that is already in the
 * browser is marked "Already here" and has Skip (the start) or Replace instead. Nothing is written to the browser's
 * storage until it is confirmed.
 */
export function ProjectImportDialog({ entries, matches, onCancel, onImport, triggerRef }: Props) {
  return (
    <Dialog open={entries !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (!triggerRef) return;
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        {entries ? <Choices entries={entries} matches={matches} onCancel={onCancel} onImport={onImport} /> : null}
      </DialogContent>
    </Dialog>
  );
}
