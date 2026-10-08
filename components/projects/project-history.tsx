"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BrandDiffTable } from "@/components/projects/brand-diff-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { svgToDataUrl } from "@/lib/icons/svg";
import { freshProject, restoreVersion, undoRestore } from "@/lib/projects/actions";
import { compareBrands, differenceSummary } from "@/lib/projects/compare";
import { MAX_VERSIONS, versionReasonLabels, type ProjectVersion } from "@/lib/projects/history";
import { snapshotTokens } from "@/lib/projects/preview";
import { projectName, type BrandProject } from "@/lib/projects/types";
import { listVersions } from "@/lib/projects/versions";
import { cn } from "@/lib/utils";

type Props = {
  /** The project whose history is shown; null closes the dialog. */
  project: BrandProject | null;
  onClose: () => void;
  /** Called after a restore or its undo, so the project list can refresh. */
  onChanged: () => void;
};

const when = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

/** A project's saved versions: pick one to preview what it changes, then restore it (with undo). */
export function ProjectHistory({ project, onClose, onChanged }: Props) {
  const id = project?.id ?? null;
  const [versions, setVersions] = useState<ProjectVersion[] | null>(null);
  const [current, setCurrent] = useState<BrandProject | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (projectId: string) => {
    const [latest, list] = await Promise.all([freshProject(projectId), listVersions(projectId)]);
    setCurrent(latest ?? null);
    setVersions(list);
    setSelectedId((selected) => (list.some((version) => version.id === selected) ? selected : (list[0]?.id ?? null)));
  }, []);

  useEffect(() => {
    if (!id) return;
    setVersions(null);
    setSelectedId(null);
    void load(id);
  }, [id, load]);

  const selected = versions?.find((version) => version.id === selectedId) ?? null;
  const preview = useMemo(() => (selected ? snapshotTokens(selected.snapshot) : null), [selected]);
  const rows = useMemo(
    () => (preview && current ? compareBrands(snapshotTokens(current.snapshot), preview) : []),
    [preview, current],
  );

  async function restore(version: ProjectVersion) {
    if (!id) return;
    setBusy(true);
    try {
      const previous = await restoreVersion(id, version);
      onChanged();
      if (!previous) return;
      // Close first: a modal dialog would keep the toast's Undo out of reach.
      onClose();
      toast.success(`Restored the version from ${when.format(version.createdAt)}`, {
        description: "The state it replaced was kept in the history.",
        action: { label: "Undo", onClick: () => void undoRestore(id, previous).then(onChanged) },
      });
    } finally {
      setBusy(false);
    }
  }

  const name = project ? projectName(project) : "project";
  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History of {name}</DialogTitle>
          <DialogDescription>
            A version is kept every few minutes while you edit and before Surprise me, imports, Brand DNA and palette
            loads. The latest {MAX_VERSIONS} are kept.
          </DialogDescription>
        </DialogHeader>
        {versions === null ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : versions.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No versions yet. They appear after a few minutes of editing, or before a big change.
          </p>
        ) : (
          <div className="grid min-h-0 gap-4 sm:grid-cols-[14rem_1fr]">
            <ul className="flex max-h-[30vh] flex-col gap-1 overflow-auto sm:max-h-[60vh]" aria-label="Versions">
              {versions.map((version) => (
                <li key={version.id}>
                  <button
                    type="button"
                    aria-current={version.id === selectedId ? "true" : undefined}
                    onClick={() => setSelectedId(version.id)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm transition-colors duration-150 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                      version.id === selectedId && "border-brand/60 bg-accent",
                    )}
                  >
                    <span className="font-medium">{when.format(version.createdAt)}</span>
                    <span className="text-xs text-muted-foreground">{versionReasonLabels[version.reason]}</span>
                  </button>
                </li>
              ))}
            </ul>
            {selected && preview ? (
              <section aria-label="Version preview" className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
                  <img src={svgToDataUrl(preview.logo.svg)} alt="" className="size-10 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{preview.name || "Untitled brand"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {preview.typography.heading} and {preview.typography.body}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => void restore(selected)} disabled={busy}>
                    <RotateCcw /> Restore
                  </Button>
                </div>
                <span className="flex h-3 overflow-hidden rounded-sm" aria-hidden="true">
                  {preview.colors.all.map((color) => (
                    <span key={color.id} className="flex-1" style={{ background: color.hex }} />
                  ))}
                </span>
                <p role="status" aria-live="polite" className="text-sm">
                  Compared with now: {differenceSummary(rows).toLowerCase()}
                </p>
                <BrandDiffTable
                  rows={rows}
                  caption={`Current ${name} compared with the version from ${when.format(selected.createdAt)}`}
                  labelA="Now"
                  labelB="This version"
                />
              </section>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
