"use client";

import {
  ArrowLeftRight,
  Copy,
  Download,
  FileDown,
  History,
  Link2,
  Plus,
  Search,
  Star,
  Tag,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { copyShareLink } from "@/components/projects/copy-share-link";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectCompare } from "@/components/projects/project-compare";
import { ProjectHistory } from "@/components/projects/project-history";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/use-projects";
import { downloadText } from "@/lib/download";
import { errorMessage } from "@/lib/i18n/errors";
import { slugify } from "@/lib/logo/pack";
import {
  addProjectTag,
  createBlankProject,
  duplicateProject,
  freshProject,
  importProjects,
  openProject,
  removeProject,
  removeProjectTag,
  renameProject,
  restoreProject,
  saveActiveProject,
  toggleFavorite,
} from "@/lib/projects/actions";
import { listProjects } from "@/lib/projects/repository";
import { projectSorts, sortProjects, type ProjectSort } from "@/lib/projects/sort";
import { projectTags } from "@/lib/projects/tags";
import { projectsToJson, projectToJson } from "@/lib/projects/transfer";
import { projectName, type BrandProject } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project-store";
import { useUiStore } from "@/store/ui-store";

/** Radix Select can't use an empty value, so "no tag filter" gets a sentinel tags can never equal (they're lowercase). */
const ALL_TAGS = "__ALL__";

export function ProjectManager() {
  const router = useRouter();
  const { t, plural } = useI18n();
  const { projects, activeId, persistent, refresh, run } = useProjects();
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleting, setDeleting] = useState<BrandProject | null>(null);
  const [comparing, setComparing] = useState(false);
  const [history, setHistory] = useState<BrandProject | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const newProjectRequested = useUiStore((state) => state.newProjectRequested);
  const clearNewProjectRequest = useUiStore((state) => state.clearNewProjectRequest);
  const sort = useProjectStore((state) => state.sort);
  const setSort = useProjectStore((state) => state.setSort);

  // "New brand project..." in the command palette lands here with the dialog already open.
  useEffect(() => {
    if (!newProjectRequested) return;
    clearNewProjectRequest();
    setNewName("");
    setCreating(true);
  }, [newProjectRequested, clearNewProjectRequest]);

  async function exportOne(project: BrandProject) {
    const latest = (await freshProject(project.id)) ?? project;
    downloadText(projectToJson(latest), `${slugify(projectName(latest))}.designhub.json`);
  }

  async function exportAll() {
    await saveActiveProject();
    const all = await listProjects();
    downloadText(projectsToJson(all), `designhub-projects-${new Date().toISOString().slice(0, 10)}.json`);
    toast.success(plural("projects.toast.exported", all.length));
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) {
      toast.error(t("projects.toast.tooLarge"));
      return;
    }
    try {
      const text = await file.text();
      let count = 0;
      await run(async () => {
        count = await importProjects(text);
      });
      toast.success(plural("projects.toast.imported", count));
    } catch (error) {
      toast.error(errorMessage(error, t, "projects.toast.importFailed"));
    }
  }

  const tags = useMemo(() => projectTags(projects ?? []), [projects]);
  // Removing the last use of the filtered tag would otherwise leave an empty list with no way back.
  const activeTag = tagFilter && tags.includes(tagFilter) ? tagFilter : null;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matching = (projects ?? []).filter(
      (project) =>
        (!favoritesOnly || project.favorite) &&
        (!activeTag || project.tags.includes(activeTag)) &&
        projectName(project).toLowerCase().includes(term),
    );
    return sortProjects(matching, sort);
  }, [projects, query, favoritesOnly, activeTag, sort]);

  async function remove(target: BrandProject) {
    const removed = await run(() => removeProject(target.id));
    if (!removed) return;
    const name = projectName(removed.project);
    toast.success(t("projects.toast.deleted", { name }), {
      duration: 8000,
      action: {
        label: t("common.undo"),
        onClick: () =>
          void run(() => restoreProject(removed.project, removed.wasActive, removed.versions)).then(() =>
            toast.success(t("projects.toast.restored", { name })),
          ),
      },
    });
  }

  async function open(project: BrandProject) {
    await run(() => openProject(project.id));
    toast.success(t("projects.toast.opened", { name: projectName(project) }), {
      action: { label: t("studio.brand.title"), onClick: () => router.push("/brand") },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("projects.search")}
            aria-label={t("projects.search")}
            className="h-9 pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((value) => !value)}
          className={cn(favoritesOnly && "border-brand/60 text-foreground")}
        >
          <Star className={cn(favoritesOnly && "fill-warning text-warning")} /> {t("projects.favorites")}
        </Button>
        <Select
          value={activeTag ?? ALL_TAGS}
          onValueChange={(value) => setTagFilter(value === ALL_TAGS ? null : value)}
          disabled={tags.length === 0}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "w-auto max-w-56 min-w-40 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left",
              activeTag && "border-brand/60 text-foreground",
            )}
            aria-label={t("projects.filterByTag")}
          >
            <Tag />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TAGS}>{t("projects.allTags")}</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as ProjectSort)}>
          <SelectTrigger size="sm" className="w-auto min-w-44" aria-label={t("projects.sortLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectSorts.map((item) => (
              <SelectItem key={item} value={item}>
                {t(`projects.sort.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setComparing(true)} disabled={(projects?.length ?? 0) < 2}>
          <ArrowLeftRight /> {t("projects.compare")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload /> {t("projects.import")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => void exportAll()} disabled={!projects?.length}>
          <FileDown /> {t("projects.exportAll")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-label={t("projects.file")}
          onChange={(event) => {
            void importFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          size="sm"
          onClick={() => {
            setNewName("");
            setCreating(true);
          }}
        >
          <Plus /> {t("projects.new")}
        </Button>
      </div>

      {!persistent ? (
        <p role="status" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          {t("projects.storageBlocked")}
        </p>
      ) : null}

      {projects === null ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={t("projects.loading")}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-60 animate-pulse rounded-xl border bg-surface-raised" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t(query || favoritesOnly || activeTag ? "projects.noMatch" : "projects.empty")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("projects.list")}>
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              active={project.id === activeId}
              onOpen={() => void open(project)}
              onRename={(name) => void run(() => renameProject(project.id, name))}
              onFavorite={() => void run(() => toggleFavorite(project.id))}
              onAddTag={(tag) => void run(() => addProjectTag(project.id, tag))}
              onRemoveTag={(tag) => void run(() => removeProjectTag(project.id, tag))}
              onDelete={() => setDeleting(project)}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("projects.history", { name: projectName(project) })}
                    onClick={() => setHistory(project)}
                  >
                    <History />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("projects.duplicate", { name: projectName(project) })}
                    onClick={() =>
                      void run(() => duplicateProject(project.id)).then(() =>
                        toast.success(t("projects.toast.duplicated")),
                      )
                    }
                  >
                    <Copy />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("projects.copyLink", { name: projectName(project) })}
                    onClick={() =>
                      void freshProject(project.id).then((latest) => copyShareLink((latest ?? project).snapshot, t))
                    }
                  >
                    <Link2 />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("projects.exportJson", { name: projectName(project) })}
                    onClick={() => void exportOne(project)}
                  >
                    <Download />
                  </Button>
                </>
              }
            />
          ))}
        </ul>
      )}

      <ProjectCompare open={comparing} onOpenChange={setComparing} projects={projects ?? []} initialId={activeId} />
      <ProjectHistory project={history} onClose={() => setHistory(null)} onChanged={() => void refresh()} />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projects.create.title")}</DialogTitle>
            <DialogDescription>{t("projects.create.description")}</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const name = newName.trim() || t("projects.create.defaultName");
              setCreating(false);
              void run(() => createBlankProject(name)).then(() => toast.success(t("projects.toast.created", { name })));
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-project-name">{t("projects.create.name")}</Label>
              <Input
                id="new-project-name"
                value={newName}
                maxLength={60}
                autoFocus
                onChange={(event) => setNewName(event.target.value)}
                placeholder={t("projects.create.defaultName")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("projects.create.submit")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projects.delete.title", { name: deleting ? projectName(deleting) : "" })}</DialogTitle>
            <DialogDescription>{t("projects.delete.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const target = deleting;
                setDeleting(null);
                if (target) void remove(target);
              }}
            >
              {t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
