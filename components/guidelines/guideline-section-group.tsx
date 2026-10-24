"use client";

import { ChevronDown } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  includedCount,
  isSectionOn,
  LOCKED_PAGE_ID,
  switchableIds,
  type SectionGroup,
} from "@/lib/guidelines/sections";
import { cn } from "@/lib/utils";

type Props = {
  group: SectionGroup;
  excluded: string[];
  /** Each included page's number in the whole book. */
  numbers: Map<string, number>;
  selected: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onTogglePage: (id: string) => void;
  onToggleSection: (ids: string[], included: boolean) => void;
};

/** One section of the page list: a foldable header with a switch for the whole section, then its pages. */
export function GuidelineSectionGroup({
  group,
  excluded,
  numbers,
  selected,
  open,
  onOpenChange,
  onSelect,
  onTogglePage,
  onToggleSection,
}: Props) {
  const { section, pages } = group;
  const listId = `guideline-section-${section.toLowerCase()}`;
  const sectionOn = isSectionOn(pages, excluded);
  const on = includedCount(pages, excluded);

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          title={`${on} of ${pages.length} pages on`}
          onClick={() => onOpenChange(!open)}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-raised"
        >
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
              !open && "-rotate-90",
            )}
            aria-hidden
          />
          <span className="truncate">{section}</span>
          <span className="ml-auto shrink-0 font-mono text-[11px] font-normal text-muted-foreground">
            <span aria-hidden>
              {on}/{pages.length}
            </span>
            <span className="sr-only">
              {on} of {pages.length} pages on
            </span>
          </span>
        </button>
        <Switch
          checked={sectionOn}
          onCheckedChange={(checked) => onToggleSection(switchableIds(pages), checked)}
          aria-label={`Include ${section} section`}
        />
      </div>
      {open ? (
        <ol id={listId} aria-label={`${section} pages`} className="flex flex-col gap-1">
          {pages.map((page) => {
            const number = numbers.get(page.id);
            return (
              <li key={page.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(page.id)}
                  aria-current={page.id === selected ? "page" : undefined}
                  title={page.description}
                  className={cn(
                    "flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-transparent px-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:border-border hover:text-foreground",
                    number === undefined && "text-subtle-foreground",
                    page.id === selected && "border-brand/60 bg-surface-raised text-foreground",
                  )}
                >
                  <span className="w-5 shrink-0 font-mono text-[11px] text-subtle-foreground">
                    {number === undefined ? "--" : String(number).padStart(2, "0")}
                  </span>
                  <span className="truncate">{page.title}</span>
                </button>
                <Switch
                  checked={number !== undefined}
                  onCheckedChange={() => onTogglePage(page.id)}
                  aria-label={`Include ${page.title}`}
                  disabled={page.id === LOCKED_PAGE_ID}
                />
              </li>
            );
          })}
        </ol>
      ) : null}
    </li>
  );
}
