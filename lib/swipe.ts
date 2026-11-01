/** A touch point, in pixels. */
export type Point = { x: number; y: number };

/** How far a swipe must go sideways, and how much more sideways than up or down it must be. */
export const SWIPE_MIN = 64;
export const SWIPE_RATIO = 2;

/** Controls that have a gesture of their own, where a sideways swipe must never change the pane. */
export const NO_SWIPE =
  '[role="slider"], [role="tab"], input, textarea, select, pre, canvas, [data-no-swipe], [contenteditable="true"]';

/** -1 for a swipe right (the pane before), 1 for a swipe left (the pane after), or 0 when it was not a clear sideways swipe. */
export function swipeDirection(start: Point, end: Point): -1 | 0 | 1 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return 0;
  return dx < 0 ? 1 : -1;
}

/** The pane a swipe moves to, or the same one at either end of the list. */
export function paneAfterSwipe<T>(panes: readonly T[], current: T, start: Point, end: Point): T {
  const direction = swipeDirection(start, end);
  const index = panes.indexOf(current);
  if (direction === 0 || index < 0) return current;
  return panes[Math.max(0, Math.min(panes.length - 1, index + direction))] ?? current;
}
