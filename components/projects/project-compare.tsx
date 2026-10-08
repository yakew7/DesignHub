"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BrandDiffTable } from "@/components/projects/brand-diff-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { freshProject } from "@/lib/projects/actions";
import { compareBrands, differenceSummary } from "@/lib/projects/compare";
import { snapshotTokens } from "@/lib/projects/preview";
import { projectName, type BrandProject } from "@/lib/projects/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: BrandProject[];
  /** Preselected on the left, usually the open project. */
  initialId: string | null;
};

function ProjectPicker({
  id,
  label,
  value,
  projects,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  projects: BrandProject[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full [&>span]:truncate">
          <SelectValue placeholder="Choose a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {projectName(project)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Two projects side by side. Both are read from storage, so comparing never opens either one
 * or touches the live stores.
 */
export function ProjectCompare({ open, onOpenChange, projects, initialId }: Props) {
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [loaded, setLoaded] = useState<[BrandProject, BrandProject] | null>(null);

  // Each time the dialog opens, start from the open project and the next one in the list.
  useEffect(() => {
    if (!open) return;
    const first = projects.find((project) => project.id === initialId) ?? projects[0];
    const second = projects.find((project) => project.id !== first?.id);
    setLeftId(first?.id ?? "");
    setRightId(second?.id ?? "");
  }, [open, projects, initialId]);

  useEffect(() => {
    if (!open || !leftId || !rightId) return;
    let active = true;
    // The latest copies, including unsaved edits to the open project.
    void Promise.all([freshProject(leftId), freshProject(rightId)]).then(([left, right]) => {
      if (active) setLoaded(left && right ? [left, right] : null);
    });
    return () => {
      active = false;
    };
  }, [open, leftId, rightId]);

  const rows = useMemo(
    () => (loaded ? compareBrands(snapshotTokens(loaded[0].snapshot), snapshotTokens(loaded[1].snapshot)) : []),
    [loaded],
  );
  const current = loaded && loaded[0].id === leftId && loaded[1].id === rightId;
  const [labelA, labelB] = loaded ? [projectName(loaded[0]), projectName(loaded[1])] : ["", ""];
  const summary = leftId === rightId ? "Same project on both sides" : differenceSummary(rows);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare projects</DialogTitle>
          <DialogDescription>
            Colors, fonts, radius, spacing and shadow side by side. Neither project is opened or changed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
          <ProjectPicker id="compare-a" label="First" value={leftId} projects={projects} onChange={setLeftId} />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 self-center sm:self-end"
            aria-label="Swap projects"
            onClick={() => {
              setLeftId(rightId);
              setRightId(leftId);
            }}
          >
            <ArrowLeftRight />
          </Button>
          <ProjectPicker id="compare-b" label="Second" value={rightId} projects={projects} onChange={setRightId} />
        </div>
        <p role="status" aria-live="polite" className="text-sm font-medium">
          {projects.length < 2 ? "Create a second project to compare." : current ? summary : "Loading..."}
        </p>
        {current ? (
          <BrandDiffTable
            rows={rows}
            caption={`${labelA} compared with ${labelB}: ${summary.toLowerCase()}`}
            labelA={labelA}
            labelB={labelB}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
