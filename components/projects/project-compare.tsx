"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useMemo, useState, type RefObject } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { BrandDiffTable } from "@/components/projects/brand-diff-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { freshProject } from "@/lib/projects/actions";
import { compareBrands, countDifferences } from "@/lib/projects/compare";
import { snapshotTokens } from "@/lib/projects/preview";
import { projectName, type BrandProject, type ProjectListItem } from "@/lib/projects/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectListItem[];
  /** Preselected on the left, usually the open project. */
  initialId: string | null;
  /** Gets focus back on close when the opener (a menu item) is gone. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
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
  projects: ProjectListItem[];
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full [&>span]:truncate">
          <SelectValue placeholder={t("compare.choose")} />
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
export function ProjectCompare({ open, onOpenChange, projects, initialId, triggerRef }: Props) {
  const { locale, t, plural } = useI18n();
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
  const differences = countDifferences(rows);
  const summary =
    leftId === rightId
      ? t("compare.sameProject")
      : differences === 0
        ? t("compare.none")
        : plural("compare.differences", differences);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (!triggerRef) return;
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("compare.title")}</DialogTitle>
          <DialogDescription>{t("compare.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end">
          <ProjectPicker
            id="compare-a"
            label={t("compare.first")}
            value={leftId}
            projects={projects}
            onChange={setLeftId}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 self-center sm:self-end"
            aria-label={t("compare.swap")}
            onClick={() => {
              setLeftId(rightId);
              setRightId(leftId);
            }}
          >
            <ArrowLeftRight />
          </Button>
          <ProjectPicker
            id="compare-b"
            label={t("compare.second")}
            value={rightId}
            projects={projects}
            onChange={setRightId}
          />
        </div>
        <p role="status" aria-live="polite" className="text-sm font-medium">
          {projects.length < 2 ? t("compare.needTwo") : current ? summary : t("common.loading")}
        </p>
        {current ? (
          <BrandDiffTable
            rows={rows}
            caption={t("compare.caption", {
              first: labelA,
              second: labelB,
              summary: summary.toLocaleLowerCase(locale),
            })}
            labelA={labelA}
            labelB={labelB}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
