"use client";

import { SearchX } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, UIEvent } from "react";

import { FontCard } from "@/components/typography/font-card";
import { FontFilters } from "@/components/typography/font-filters";
import { RecentFonts } from "@/components/typography/recent-fonts";
import { Button } from "@/components/ui/button";
import { useSelectFont } from "@/hooks/use-select-font";
import { filterFonts } from "@/lib/typography/filter";
import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/store/library-store";
import { useTypographyStore } from "@/store/typography-store";
import type { FontFamily } from "@/types/typography";

const PAGE_SIZE = 40;
const ROW_HEIGHT = 60;
const OVERSCAN = 8;

type FontBrowserProps = {
  fonts: FontFamily[];
  loading: boolean;
  className?: string;
};

/** Search and filters on top, a virtualized scrolling list below that loads more as you reach the end. */
export function FontBrowser({ fonts, loading, className }: FontBrowserProps) {
  const activeFont = useTypographyStore((state) => state.activeFont);
  const filters = useTypographyStore((state) => state.filters);
  const resetFilters = useTypographyStore((state) => state.resetFilters);
  const favorites = useLibraryStore((state) => state.favoriteFonts);
  const toggleFavoriteFont = useLibraryStore((state) => state.toggleFavoriteFont);
  const selectFont = useSelectFont();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const results = useMemo(() => filterFonts(fonts, filters, favorites), [fonts, filters, favorites]);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Set by arrow keys so the effect below scrolls only for keyboard moves, not clicks.
  const revealRef = useRef(false);
  const optionId = useId();
  const hintId = useId();

  const listboxRef = useRef<HTMLUListElement>(null);

  /** Scrolls the minimum needed to show a row, which may not be rendered yet: rows are fixed height. */
  const scrollRowIntoView = useCallback((index: number) => {
    const node = listRef.current;
    if (!node) return;
    // The list sits below the scroller's padding (and the skeleton while loading).
    const offset = (listboxRef.current?.offsetTop ?? node.offsetTop) - node.offsetTop;
    const top = offset + index * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    if (top < node.scrollTop) {
      node.scrollTo({ top: index === 0 ? 0 : top });
    } else if (bottom > node.scrollTop + node.clientHeight) {
      node.scrollTo({ top: bottom - node.clientHeight });
    }
  }, []);

  // New filters start back at the top of the list.
  useEffect(() => {
    setVisible(PAGE_SIZE);
    setScrollTop(0);
    setFocusedIndex(null);
    listRef.current?.scrollTo({ top: 0 });
  }, [filters]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;

    const updateHeight = () => setViewportHeight(node.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const hasMore = results.length > visible;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible((count) => count + PAGE_SIZE);
      },
      { root: listRef.current, rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  const activeIndex = results.findIndex((font) => font.family === activeFont);
  useEffect(() => {
    if (activeIndex < 0) return;

    if (activeIndex >= visible) {
      setVisible(Math.min(results.length, Math.ceil((activeIndex + 1) / PAGE_SIZE) * PAGE_SIZE));
      return;
    }

    if (viewportHeight === 0) return;
    scrollRowIntoView(activeIndex);
  }, [activeIndex, activeFont, results.length, viewportHeight, visible, scrollRowIntoView]);

  // Favoriting with "favorites only" on can shrink the list under the highlight.
  const focused = focusedIndex === null || results.length === 0 ? null : Math.min(focusedIndex, results.length - 1);

  // Keyboard moves past the loaded rows load more first, then scroll once those rows exist.
  useEffect(() => {
    if (focused === null || !revealRef.current) return;
    if (focused >= visible) {
      setVisible(Math.min(results.length, Math.ceil((focused + 1) / PAGE_SIZE) * PAGE_SIZE));
      return;
    }
    revealRef.current = false;
    scrollRowIntoView(focused);
  }, [focused, visible, results.length, scrollRowIntoView]);

  const moveTo = (index: number) => {
    revealRef.current = true;
    setFocusedIndex(Math.max(0, Math.min(results.length - 1, index)));
  };

  /** The listbox keeps DOM focus, so recycled rows never take focus with them. */
  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (results.length === 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = focused ?? Math.max(0, activeIndex);
    const page = Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT) - 1);
    const key = event.key;
    if (key === "ArrowDown") moveTo(focused === null ? current : current + 1);
    else if (key === "ArrowUp") moveTo(focused === null ? current : current - 1);
    else if (key === "PageDown") moveTo(current + page);
    else if (key === "PageUp") moveTo(current - page);
    else if (key === "Home") moveTo(0);
    else if (key === "End") moveTo(results.length - 1);
    else if (key === "Enter" || key === " ") {
      const font = results[current];
      if (font) selectFont(font.family);
      moveTo(current);
    } else if (key.toLowerCase() === "s" && !event.shiftKey) {
      const font = results[current];
      if (font) toggleFavoriteFont(font.family);
    } else return;
    // Keeps Space and the studio's single-letter hotkeys from also firing.
    event.preventDefault();
    event.stopPropagation();
  };

  // Stable, so the memoized rows don't re-render on every scroll.
  const handleSelect = useCallback(
    (family: string) => {
      setFocusedIndex(results.findIndex((font) => font.family === family));
      selectFont(family);
    },
    [results, selectFont],
  );

  const shown = results.slice(0, visible);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(shown.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
  const rowIndexes = Array.from({ length: Math.max(0, endIndex - startIndex) }, (_, offset) => startIndex + offset);

  // The highlighted row stays mounted even when scrolled away, so aria-activedescendant always resolves.
  if (focused !== null && focused < shown.length && (focused < startIndex || focused >= endIndex)) {
    rowIndexes.push(focused);
    rowIndexes.sort((a, b) => a - b);
  }
  const activeDescendant = focused !== null && focused < shown.length ? `${optionId}-${focused}` : undefined;

  return (
    <section
      aria-labelledby="google-fonts-title"
      className={cn("relative flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card", className)}
    >
      <div className="flex flex-col gap-3 border-b p-4">
        <h2 id="google-fonts-title" className="text-sm font-medium">
          Google Fonts
        </h2>
        <FontFilters resultCount={results.length} />
        <RecentFonts />
      </div>
      <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin">
        {loading ? (
          <ul className="flex flex-col gap-1" aria-busy="true" aria-label="Loading fonts">
            {Array.from({ length: 10 }, (_, index) => (
              <li key={index} className="h-[54px] animate-pulse rounded-md bg-muted/40" />
            ))}
          </ul>
        ) : null}
        {!loading && results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <SearchX className="size-6 text-subtle-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No fonts match these filters.</p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        ) : null}
        <p id={hintId} className="sr-only">
          Arrow keys, Page Up, Page Down, Home and End move through the fonts. Enter opens one. S adds it to favorites.
        </p>
        <ul
          ref={listboxRef}
          role="listbox"
          tabIndex={shown.length > 0 ? 0 : undefined}
          className="group/fonts relative rounded-md focus-visible:outline-none"
          style={{ height: shown.length * ROW_HEIGHT }}
          aria-label="Fonts"
          aria-describedby={hintId}
          aria-activedescendant={activeDescendant}
          onKeyDown={handleKeyDown}
          // Clicking a heart shouldn't pull focus out of the list and strand the arrow keys.
          onMouseDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) event.preventDefault();
          }}
          onFocus={(event) => {
            // Tabbing in starts on the open font, or the first one.
            if (event.target === event.currentTarget && focusedIndex === null && results.length > 0) {
              setFocusedIndex(Math.max(0, activeIndex));
            }
          }}
        >
          {rowIndexes.map((index) => {
            const font = shown[index];
            if (!font) return null;

            return (
              <li
                key={font.family}
                id={`${optionId}-${index}`}
                role="option"
                aria-selected={font.family === activeFont}
                aria-label={font.family}
                data-highlighted={index === focused ? "" : undefined}
                className="absolute inset-x-0 h-[60px] rounded-md group-focus-visible/fonts:data-highlighted:ring-2 group-focus-visible/fonts:data-highlighted:ring-ring"
                style={{ top: index * ROW_HEIGHT }}
                aria-setsize={results.length}
                aria-posinset={index + 1}
              >
                <FontCard font={font} active={font.family === activeFont} onSelect={handleSelect} />
              </li>
            );
          })}
        </ul>
        {hasMore ? (
          <div ref={sentinelRef} className="flex justify-center py-3">
            <Button variant="ghost" size="sm" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
              Show more · {results.length - visible} remaining
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
