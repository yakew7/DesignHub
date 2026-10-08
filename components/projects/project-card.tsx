"use client";

import { Check, Pencil, Star, Trash2, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { ProjectTags } from "@/components/projects/project-tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { svgToDataUrl } from "@/lib/icons/svg";
import type { Translate } from "@/lib/i18n/translate";
import { snapshotTokens } from "@/lib/projects/preview";
import { projectName, type BrandProject } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

type Props = {
  project: BrandProject;
  active: boolean;
  onOpen: () => void;
  onRename: (name: string) => void;
  onFavorite: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onDelete: () => void;
  /** Extra actions (duplicate, export). */
  actions?: ReactNode;
};

function ago(time: number, locale: string, t: Translate): string {
  if (!time) return t("projects.card.never");
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const seconds = Math.round((time - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return t("projects.card.justNow");
}

export function ProjectCard({
  project,
  active,
  onOpen,
  onRename,
  onFavorite,
  onAddTag,
  onRemoveTag,
  onDelete,
  actions,
}: Props) {
  const { locale, t } = useI18n();
  const tokens = useMemo(() => snapshotTokens(project.snapshot), [project.snapshot]);
  const name = projectName(project);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== name) onRename(draft);
  };

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card transition-colors duration-150",
        active && "border-brand/60 ring-1 ring-brand/30",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative flex h-36 items-center justify-center bg-surface-raised outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={t(active ? "projects.card.isOpen" : "projects.card.openNamed", { name })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
        <img
          src={svgToDataUrl(tokens.logo.svg)}
          alt=""
          className="size-16 object-contain transition-transform duration-200 group-hover:scale-105"
        />
        <span className="absolute inset-x-0 bottom-0 flex h-2">
          {tokens.colors.all.map((color) => (
            <span key={color.id} className="flex-1" style={{ background: color.hex }} />
          ))}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          {editing ? (
            <form
              className="flex min-w-0 flex-1 items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                commit();
              }}
            >
              <Input
                value={draft}
                autoFocus
                maxLength={60}
                aria-label={t("projects.card.name")}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setDraft(name);
                    setEditing(false);
                  }
                }}
                className="h-7 text-sm"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("projects.card.saveName")}
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("projects.card.cancelRename")}
                onClick={() => {
                  setDraft(name);
                  setEditing(false);
                }}
              >
                <X />
              </Button>
            </form>
          ) : (
            <>
              <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{name}</h2>
              {active ? <Badge variant="brand">{t("projects.card.openBadge")}</Badge> : null}
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t(project.favorite ? "projects.card.unfavorite" : "projects.card.favorite", { name })}
                aria-pressed={project.favorite}
                onClick={onFavorite}
              >
                <Star className={cn(project.favorite && "fill-warning text-warning")} />
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("projects.card.meta", {
            edited: ago(project.updatedAt, locale, t),
            opened: ago(project.lastOpenedAt, locale, t),
          })}
        </p>
        <ProjectTags name={name} tags={project.tags} onAdd={onAddTag} onRemove={onRemoveTag} />
        <div className="mt-auto flex items-center gap-1 pt-1">
          <Button size="sm" variant={active ? "outline" : "default"} onClick={onOpen} disabled={active}>
            {t(active ? "projects.card.current" : "common.open")}
          </Button>
          <span className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("projects.card.rename", { name })}
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
          >
            <Pencil />
          </Button>
          {actions}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("projects.card.delete", { name })}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
