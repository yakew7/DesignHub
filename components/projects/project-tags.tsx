"use client";

import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Input } from "@/components/ui/input";
import { MAX_PROJECT_TAGS, MAX_TAG_LENGTH, normalizeTag } from "@/lib/projects/tags";

type Props = {
  name: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
};

/** A project's tags as removable chips, plus an inline field to add one (five at most). */
export function ProjectTags({ name, tags, onAdd, onRemove }: Props) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  // Closing the field (Enter or Escape) unmounts it, which can still fire blur; this stops a second save.
  const closed = useRef(false);
  const full = tags.length >= MAX_PROJECT_TAGS;

  const commit = () => {
    if (closed.current) return;
    closed.current = true;
    const tag = normalizeTag(draft);
    if (tag && !tags.includes(tag)) onAdd(tag);
    setDraft("");
    setAdding(false);
  };

  return (
    <ul className="flex min-h-6 flex-wrap items-center gap-1" aria-label={t("projects.tags.list", { name })}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="flex h-6 items-center gap-0.5 rounded-full border bg-surface-raised pr-0.5 pl-2 text-xs text-muted-foreground"
        >
          {tag}
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded-full hover:bg-accent hover:text-foreground"
            aria-label={t("projects.tags.remove", { tag, name })}
            onClick={() => onRemove(tag)}
          >
            <X className="size-3" aria-hidden />
          </button>
        </li>
      ))}
      {full ? null : (
        <li>
          {adding ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                commit();
              }}
            >
              <Input
                value={draft}
                autoFocus
                maxLength={MAX_TAG_LENGTH}
                aria-label={t("projects.tags.new", { name })}
                placeholder={t("projects.tags.placeholder")}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    closed.current = true;
                    setDraft("");
                    setAdding(false);
                  }
                }}
                className="h-6 w-28 rounded-full px-2 text-xs"
              />
            </form>
          ) : (
            <button
              type="button"
              className="flex h-6 items-center gap-1 rounded-full border border-dashed px-2 text-xs text-muted-foreground hover:border-border-strong hover:text-foreground"
              aria-label={t("projects.tags.add", { name })}
              title={t("projects.tags.limit", { max: MAX_PROJECT_TAGS })}
              onClick={() => {
                closed.current = false;
                setAdding(true);
              }}
            >
              <Plus className="size-3" aria-hidden /> {t("projects.tags.button")}
            </button>
          )}
        </li>
      )}
    </ul>
  );
}
