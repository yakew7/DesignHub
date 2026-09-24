"use client";

import { ChevronDown } from "lucide-react";

import { useHotkey } from "@/hooks/use-hotkeys";
import { socialPlatforms, socialTemplates } from "@/lib/social/registry";
import type { SocialTemplate } from "@/lib/social/types";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/store/social-store";

type Entry = { kind: "single"; template: SocialTemplate } | { kind: "group"; name: string; styles: SocialTemplate[] };

/** Templates of one platform, with styles of the same asset folded into one expandable row. */
function entriesFor(platform: string): Entry[] {
  const entries: Entry[] = [];
  for (const template of socialTemplates.filter((item) => item.platform === platform)) {
    if (!template.group) {
      entries.push({ kind: "single", template });
      continue;
    }
    const existing = entries.find((entry) => entry.kind === "group" && entry.name === template.group);
    if (existing && existing.kind === "group") existing.styles.push(template);
    else entries.push({ kind: "group", name: template.group, styles: [template] });
  }
  return entries;
}

const rowClass =
  "flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground";

export function SocialPicker() {
  const template = useSocialStore((state) => state.template);
  const setTemplate = useSocialStore((state) => state.setTemplate);
  const platforms = socialPlatforms.filter((platform) => socialTemplates.some((item) => item.platform === platform));
  // Cycle in the order the picker shows them (grouped by platform), wrapping at both ends.
  const ordered = platforms.flatMap((platform) => socialTemplates.filter((item) => item.platform === platform));
  const cycle = (step: number) => {
    if (ordered.length === 0) return;
    const index = ordered.findIndex((item) => item.id === template);
    const next = ordered[(Math.max(index, 0) + step + ordered.length) % ordered.length];
    if (next) setTemplate(next.id);
  };
  useHotkey("]", () => cycle(1));
  useHotkey("[", () => cycle(-1));

  if (platforms.length === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No templates yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {platforms.map((platform) => (
        <div key={platform} role="radiogroup" aria-label={platform} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.12em] text-subtle-foreground uppercase">{platform}</span>
          <div className="flex flex-col gap-1.5">
            {entriesFor(platform).map((entry) => {
              if (entry.kind === "single") {
                const item = entry.template;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={item.id === template}
                    title={item.description}
                    onClick={() => setTemplate(item.id)}
                    className={cn(
                      rowClass,
                      item.id === template && "border-brand/60 bg-surface-raised text-foreground",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">
                      {item.width}×{item.height}
                    </span>
                  </button>
                );
              }
              const first = entry.styles[0];
              const active = entry.styles.some((item) => item.id === template);
              return (
                <div key={entry.name} className="flex flex-col gap-1">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={`${entry.styles.length} styles`}
                    onClick={() => !active && first && setTemplate(first.id)}
                    className={cn(rowClass, active && "border-brand/60 bg-surface-raised text-foreground")}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <ChevronDown
                        className={cn("size-3.5 shrink-0 transition-transform duration-150", !active && "-rotate-90")}
                        aria-hidden
                      />
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">
                      {active ? entry.styles.length : `${first?.width}×${first?.height}`}
                    </span>
                  </button>
                  {active ? (
                    <div
                      role="radiogroup"
                      aria-label={`${entry.name} styles`}
                      className="ml-3 flex flex-col gap-0.5 border-l pl-2"
                    >
                      {entry.styles.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={item.id === template}
                          title={item.description}
                          onClick={() => setTemplate(item.id)}
                          className={cn(
                            "flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-surface-raised hover:text-foreground",
                            item.id === template && "bg-surface-raised font-medium text-foreground",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "size-1.5 shrink-0 rounded-full bg-border-strong transition-colors duration-150",
                              item.id === template && "bg-brand",
                            )}
                          />
                          {item.style}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
