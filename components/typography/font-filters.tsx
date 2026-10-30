"use client";

import { Heart, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkeys";
import { fontCategories, fontCategoryLabels } from "@/lib/typography/catalog";
import type { FontSort } from "@/lib/typography/filter";
import { useTypographyStore } from "@/store/typography-store";
import type { FontCategory } from "@/types/typography";

/** Short labels so every category fits on one line in the narrow font pane. */
const shortLabels: Record<FontCategory, string> = {
  "sans-serif": "Sans",
  serif: "Serif",
  display: "Display",
  handwriting: "Script",
  monospace: "Mono",
};

const sorts: { value: FontSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "alphabetical", label: "A → Z" },
  { value: "weights", label: "Most weights" },
];

export function FontFilters({ resultCount }: { resultCount: number }) {
  const { plural } = useI18n();
  const filters = useTypographyStore((state) => state.filters);
  const [announcedCount, setAnnouncedCount] = useState(resultCount);
  useEffect(() => {
    const timeout = window.setTimeout(() => setAnnouncedCount(resultCount), 300);
    return () => window.clearTimeout(timeout);
  }, [resultCount]);
  const setFilters = useTypographyStore((state) => state.setFilters);
  const inputRef = useRef<HTMLInputElement>(null);
  useHotkey("f", () => inputRef.current?.focus());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            type="search"
            value={filters.query}
            onChange={(event) => setFilters({ query: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setFilters({ query: "" });
                event.currentTarget.blur();
              }
            }}
            placeholder="Search fonts"
            aria-label="Search fonts"
            className="pr-16 pl-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => setFilters({ query: "" })}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-subtle-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">F</Kbd>
          )}
        </div>
        <Select value={filters.sort} onValueChange={(value) => setFilters({ sort: value as FontSort })}>
          <SelectTrigger className="w-32 shrink-0" aria-label="Sort fonts">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <ToggleGroup
          type="single"
          value={filters.category}
          onValueChange={(value) => value && setFilters({ category: value as FontCategory | "all" })}
          aria-label="Category"
          className="w-full"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          {fontCategories.map((category) => (
            <ToggleGroupItem key={category} value={category} aria-label={fontCategoryLabels[category]}>
              {shortLabels[category]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Switch
            id="variable-only"
            checked={filters.variableOnly}
            onCheckedChange={(variableOnly) => setFilters({ variableOnly })}
          />
          <Label htmlFor="variable-only">Variable only</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="favorites-only"
            checked={filters.favoritesOnly}
            onCheckedChange={(favoritesOnly) => setFilters({ favoritesOnly })}
          />
          <Label htmlFor="favorites-only">
            <Heart className="size-3" aria-hidden /> Favorites
          </Label>
        </div>
        <p className="ml-auto text-xs text-subtle-foreground" aria-live="off">
          {plural("typography.fonts.count", resultCount)}
        </p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {plural("typography.fonts.count", announcedCount)}
        </p>
      </div>
    </div>
  );
}
