"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { IconGlyph } from "@/components/icons/icon-image";
import { Button } from "@/components/ui/button";
import { useIconData } from "@/hooks/use-icon-data";
import { useWindowedGrid } from "@/hooks/use-windowed-grid";
import { splitIconId } from "@/lib/icons/iconify";
import { defaultIconStyle } from "@/lib/icons/svg";
import { cn } from "@/lib/utils";
import { useIconStore } from "@/store/icon-store";
import type { IconData, IconId } from "@/types/icons";

type IconGridProps = {
  ids: IconId[];
  emptyMessage?: string;
};

const gridStyle = { ...defaultIconStyle, size: 32 };

export function IconsError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <AlertTriangle className="size-5 text-warning" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ??
          "Couldn't reach Iconify or its mirrors. Check your connection. Icons you opened before still work offline."}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw /> Try again
      </Button>
    </div>
  );
}

const TILE_MIN = 64;
const TILE_GAP = 8;

/**
 * Icons as a grid of tiles. Only the rows near the view are in the page, and only their bodies are fetched, so
 * a collection of thousands costs as much as a screenful. The grid is one tab stop and the arrow keys, Page Up and
 * Page Down, Home and End move through the whole list: the target tile is drawn, then focused.
 */
export function IconGrid({ ids, emptyMessage = "No icons found." }: IconGridProps) {
  const selected = useIconStore((state) => state.selected);
  const select = useIconStore((state) => state.select);
  const [focused, setFocused] = useState<number | null>(null);
  const grid = useWindowedGrid<HTMLDivElement>({ count: ids.length, minTile: TILE_MIN, gap: TILE_GAP, keep: focused });
  const windowIds = useMemo(() => ids.slice(grid.start, grid.end), [ids, grid.start, grid.end]);
  const { icons, failed, loading, error, retry } = useIconData(windowIds);
  const listRef = useRef<HTMLUListElement>(null);
  // A new list (another search or collection) has nothing focused yet.
  useEffect(() => setFocused(null), [ids]);

  // Bodies already fetched stay known while the window moves, so scrolling back does not blink.
  const known = useRef(new Map<IconId, IconData>());
  icons.forEach((icon, id) => known.current.set(id, icon));

  if (error) return <IconsError onRetry={retry} />;
  if (ids.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  // One tab stop for the whole grid: the icon that has focus, or the first one drawn.
  const stop = Math.min(ids.length - 1, Math.max(0, focused ?? grid.start));

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = Number((event.target as HTMLElement).closest<HTMLElement>("[data-index]")?.dataset.index);
    if (Number.isNaN(index)) return;
    const screen = Math.max(1, Math.floor((window.innerHeight * 0.8) / grid.rowHeight)) * grid.columns;
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + grid.columns,
      ArrowUp: index - grid.columns,
      PageDown: index + screen,
      PageUp: index - screen,
      Home: 0,
      End: ids.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    // A move past either end stops at it. The tile is drawn first, then focused and scrolled into view.
    const next = Math.max(0, Math.min(ids.length - 1, target));
    flushSync(() => setFocused(next));
    const tile = listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`);
    tile?.focus();
    tile?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only" aria-live="polite">{`${ids.length} icons`}</p>
      <div ref={grid.ref} className="relative" style={{ height: grid.height }}>
        <ul
          ref={listRef}
          className="absolute inset-x-0 grid gap-2"
          style={{ top: grid.offset, gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }}
          aria-busy={loading}
          aria-label="Icons"
          onKeyDown={onKeyDown}
        >
          {windowIds.map((id, offset) => {
            const index = grid.start + offset;
            return (
              <IconTile
                key={id}
                id={id}
                index={index}
                total={ids.length}
                icon={known.current.get(id)}
                failed={failed.has(id) || (!loading && !known.current.has(id))}
                tabStop={index === stop}
                active={id === selected}
                onSelect={select}
                onFocusTile={setFocused}
              />
            );
          })}
        </ul>
      </div>
      {!loading && failed.size > 0 ? (
        <Button variant="outline" size="sm" className="self-center" onClick={retry}>
          <RotateCw /> Retry {failed.size} icons that failed to load
        </Button>
      ) : null}
    </div>
  );
}

type IconTileProps = {
  id: IconId;
  index: number;
  total: number;
  onFocusTile: (index: number) => void;
  /** The one tile in the grid that Tab reaches. */
  tabStop: boolean;
  icon: IconData | undefined;
  failed: boolean;
  active: boolean;
  onSelect: (id: IconId) => void;
};

const IconTile = memo(function IconTile({
  id,
  index,
  total,
  icon,
  failed,
  active,
  tabStop,
  onSelect,
  onFocusTile,
}: IconTileProps) {
  const { name } = splitIconId(id);
  return (
    <li aria-setsize={total} aria-posinset={index + 1}>
      <button
        type="button"
        data-index={index}
        tabIndex={tabStop ? 0 : -1}
        onFocus={() => onFocusTile(index)}
        onClick={() => onSelect(id)}
        aria-pressed={active}
        aria-label={id}
        title={failed ? `${id} (failed to load)` : id}
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-lg border bg-card text-foreground transition-[border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-raised",
          active && "border-brand/60 bg-surface-raised",
        )}
      >
        {icon ? (
          <IconGlyph icon={icon} style={gridStyle} alt="" className="size-7" />
        ) : failed ? (
          <AlertTriangle className="size-4 text-subtle-foreground" aria-hidden />
        ) : (
          <span className="size-6 animate-pulse rounded-md bg-muted" aria-hidden />
        )}
        <span className="sr-only">{name}</span>
      </button>
    </li>
  );
});
