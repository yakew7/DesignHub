import type { StudioId } from "@/lib/navigation";

/**
 * What a person comes to make, and the studio that makes it. The home page shows these instead of every
 * studio at once; the full list of studios stays one click away.
 */
export const homeGoals = [
  { id: "logo", studio: "logo" },
  { id: "social", studio: "social" },
  { id: "brandBook", studio: "guidelines" },
  { id: "tokens", studio: "export" },
  { id: "palette", studio: "colors" },
  { id: "fonts", studio: "typography" },
  { id: "icon", studio: "icons" },
  { id: "background", studio: "backgrounds" },
] as const satisfies readonly { id: string; studio: StudioId }[];

/** How many goals a returning person sees before the rest are folded behind a button. */
export const VISIBLE_GOALS = 4;

/**
 * The goals with those of the studios the person used first: the last studio, then the studios chosen in the
 * command palette, newest first. A first visit has neither, so the order is the one above.
 */
export function orderGoals(lastStudio: string | null, recent: readonly string[]): (typeof homeGoals)[number][] {
  const used = [lastStudio, ...recent.filter((id) => id.startsWith("studio:")).map((id) => id.slice(7))].filter(
    (id): id is string => Boolean(id),
  );
  const rank = (studio: string) => {
    const index = used.indexOf(studio);
    return index < 0 ? used.length : index;
  };
  return [...homeGoals].sort((a, b) => rank(a.studio) - rank(b.studio));
}
