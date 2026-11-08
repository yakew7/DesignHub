"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Input } from "@/components/ui/input";
import { useHotkey } from "@/hooks/use-hotkeys";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import {
  matchingSocialTemplates,
  orderedSocialPlatforms,
  socialPlatformGroups,
  socialTemplates,
} from "@/lib/social/registry";
import { socialGroupName, socialShortName, socialTemplateName } from "@/lib/social/names";
import type { SocialPlatform, SocialTemplateInfo } from "@/lib/social/types";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/store/social-store";

type Entry =
  { kind: "single"; template: SocialTemplateInfo } | { kind: "group"; name: string; styles: SocialTemplateInfo[] };

/** Templates of one platform, with styles of the same asset folded into one expandable row. */
function entriesFor(platform: string, matches: Set<string> | null): Entry[] {
  const entries: Entry[] = [];
  for (const template of socialTemplates.filter(
    (item) => item.platform === platform && (!matches || matches.has(item.id)),
  )) {
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

function PlatformSection({
  platform,
  matches,
  folded,
  setFolded,
}: {
  platform: SocialPlatform;
  /** Ids a search matches, or null when nothing is typed. */
  matches: Set<string> | null;
  folded: Record<string, boolean>;
  setFolded: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  const { t } = useI18n();
  const template = useSocialStore((state) => state.template);
  const setTemplate = useSocialStore((state) => state.setTemplate);
  return (
    <div key={platform} role="radiogroup" aria-label={platform} className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.12em] text-subtle-foreground uppercase">{platform}</span>
      <div className="flex flex-col gap-1.5">
        {entriesFor(platform, matches).map((entry) => {
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
                className={cn(rowClass, item.id === template && "border-brand/60 bg-surface-raised text-foreground")}
              >
                <span className="truncate">{socialTemplateName(t, item)}</span>
                <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">
                  {item.width}×{item.height}
                </span>
              </button>
            );
          }
          const first = entry.styles[0];
          const active = entry.styles.some((item) => item.id === template);
          const open = (active || matches !== null) && !folded[entry.name];
          const listId = `styles-${entry.name.toLowerCase().replace(/\s+/g, "-")}`;
          return (
            <div key={entry.name} className="flex flex-col gap-1">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                title={t("social.picker.styles", { count: entry.styles.length })}
                onClick={() => {
                  if (!active && first) setTemplate(first.id);
                  setFolded((state) => ({ ...state, [entry.name]: active ? open : false }));
                }}
                className={cn(rowClass, active && "border-brand/60 bg-surface-raised text-foreground")}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <ChevronDown
                    className={cn("size-3.5 shrink-0 transition-transform duration-150", !open && "-rotate-90")}
                    aria-hidden
                  />
                  <span className="truncate">{socialGroupName(t, entry.name)}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">
                  {open
                    ? entry.styles.length
                    : active
                      ? socialShortName(t, entry.styles.find((item) => item.id === template) ?? entry.styles[0]!)
                      : `${first?.width}×${first?.height}`}
                </span>
              </button>
              {open ? (
                <div
                  id={listId}
                  role="radiogroup"
                  aria-label={t("social.picker.stylesLabel", { name: socialGroupName(t, entry.name) })}
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
                      {socialShortName(t, item)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SocialPicker() {
  const { t } = useI18n();
  const radiosRef = useRovingRadio<HTMLDivElement>();
  const template = useSocialStore((state) => state.template);
  const setTemplate = useSocialStore((state) => state.setTemplate);
  const moreOpen = useSocialStore((state) => state.morePlatformsOpen);
  const setMoreOpen = useSocialStore((state) => state.setMorePlatformsOpen);
  // Groups the user folded away. A group with the selected style is open unless folded.
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const matches = matchingSocialTemplates(query, (item) => socialTemplateName(t, item));
  const platforms = orderedSocialPlatforms.filter((platform) =>
    socialTemplates.some((item) => item.platform === platform && (!matches || matches.has(item.id))),
  );
  const core = platforms.filter((platform) => socialPlatformGroups[platform] === "core");
  const more = platforms.filter((platform) => socialPlatformGroups[platform] === "more");
  // Cycle in the order the picker shows them (grouped by platform), wrapping at both ends.
  const ordered = platforms.flatMap((platform) =>
    socialTemplates.filter((item) => item.platform === platform && (!matches || matches.has(item.id))),
  );
  const selected = socialTemplates.find((item) => item.id === template);
  // The selected template is never hidden: its platform's group opens with it.
  const selectedIsMore = selected ? socialPlatformGroups[selected.platform] === "more" : false;
  const showMore = moreOpen || selectedIsMore || matches !== null;
  const cycle = (step: number) => {
    if (ordered.length === 0) return;
    const index = ordered.findIndex((item) => item.id === template);
    const next = ordered[(Math.max(index, 0) + step + ordered.length) % ordered.length];
    if (next) setTemplate(next.id);
  };
  useHotkey("]", () => cycle(1));
  useHotkey("[", () => cycle(-1));

  if (socialTemplates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t("social.picker.empty")}</p>
    );
  }

  return (
    <div ref={radiosRef} className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("social.picker.search")}
          placeholder={t("social.picker.search")}
          className="pl-8"
        />
      </div>
      {matches && platforms.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("social.picker.noMatch")}</p>
      ) : null}
      {core.map((platform) => (
        <PlatformSection key={platform} platform={platform} matches={matches} folded={folded} setFolded={setFolded} />
      ))}
      {more.length > 0 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-expanded={showMore}
            aria-controls="social-more-platforms"
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground"
          >
            <span>
              {t("social.picker.more")} <span className="font-normal">({more.length})</span>
            </span>
            <ChevronDown
              className={cn("size-3.5 transition-transform duration-150", !showMore && "-rotate-90")}
              aria-hidden
            />
          </button>
          {showMore ? (
            <div id="social-more-platforms" className="flex flex-col gap-3">
              {more.map((platform) => (
                <PlatformSection
                  key={platform}
                  platform={platform}
                  matches={matches}
                  folded={folded}
                  setFolded={setFolded}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
