"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { gridGeometry, visibleRange, type GridGeometry } from "@/lib/windowing";

/** The nearest ancestor that scrolls, or null when the page itself does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return null;
}

type Options = { count: number; minTile: number; gap: number; overscan?: number; keep?: number | null };

/**
 * Which tiles of a grid to draw while the page scrolls. The grid is `position: relative` with the full height
 * of every row, and the drawn tiles sit inside it from `offset` down, so scrolling and the scrollbar behave as
 * if all tiles existed. `keep` is an index that stays drawn (the one with focus).
 */
export function useWindowedGrid<T extends HTMLElement>({ count, minTile, gap, overscan = 3, keep = null }: Options) {
  const ref = useRef<T>(null);
  const [geometry, setGeometry] = useState<GridGeometry>(() => gridGeometry(0, minTile, gap));
  const [view, setView] = useState({ top: 0, bottom: 800 });

  const measure = useCallback(() => {
    const node = ref.current;
    // A grid that is hidden (display: none) has no width: keep the geometry it had, so it is right when shown again.
    if (!node || node.clientWidth === 0) return;
    setGeometry((current) => {
      const next = gridGeometry(node.clientWidth, minTile, gap);
      return next.columns === current.columns && Math.abs(next.tile - current.tile) < 0.5 ? current : next;
    });
    const rect = node.getBoundingClientRect();
    const scroller = scrollParent(node);
    // The viewport is the scrolling ancestor's box, or the window; both are measured from the grid's top.
    const box = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    setView((current) => {
      const top = Math.round(box.top - rect.top);
      const bottom = Math.round(box.bottom - rect.top);
      return current.top === top && current.bottom === bottom ? current : { top, bottom };
    });
  }, [minTile, gap]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(node);
    // Scroll events do not bubble, so listen in the capture phase to hear any ancestor that scrolls.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [measure]);

  const { columns, rowHeight } = geometry;
  const range = visibleRange({
    count,
    columns,
    rowHeight,
    viewTop: view.top,
    viewBottom: view.bottom,
    overscan,
    keep,
  });
  const rows = Math.ceil(count / columns);
  return {
    ref,
    columns,
    rowHeight,
    start: range.start,
    end: range.end,
    /** Full height of the grid, as if every row were drawn. */
    height: Math.max(0, rows * rowHeight - gap),
    /** Where the first drawn row starts. */
    offset: Math.floor(range.start / columns) * rowHeight,
    remeasure: measure,
  };
}
