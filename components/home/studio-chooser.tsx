"use client";

import { StudioLink as Link } from "@/components/layout/studio-link";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Message } from "@/components/layout/message";
import { useKeptStudios } from "@/hooks/use-kept-studios";
import { getStudio, studios } from "@/lib/navigation";
import { orderGoals, VISIBLE_GOALS } from "@/lib/home-goals";
import { useCommandRecentsStore } from "@/store/command-recents-store";
import { useNavStore } from "@/store/nav-store";

/** A short "what do you want to make?" with one link per goal, in place of a card for every studio. */
export function StudioChooser() {
  // One tab stop for the whole grid; the arrow keys, Home and End move between the goals.
  const [stop, setStop] = useState(0);
  const { t } = useI18n();
  const { kept } = useKeptStudios();
  const lastStudioId = useNavStore((state) => state.lastStudio);
  const lastStudio = lastStudioId ? (studios.find((item) => item.id === lastStudioId) ?? null) : null;
  const recent = useCommandRecentsStore((state) => state.recent);
  const [showAll, setShowAll] = useState(false);
  // A returning person sees the goals of the studios they use first, and the rest behind a button.
  const returning = Boolean(lastStudio) || recent.some((id) => id.startsWith("studio:"));
  const ordered = orderGoals(lastStudioId, recent);
  const goals = returning && !showAll ? ordered.slice(0, VISIBLE_GOALS) : ordered;
  const list = useRef<HTMLUListElement>(null);

  const move = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const links = [...(list.current?.querySelectorAll<HTMLAnchorElement>("a[data-goal]") ?? [])];
    const index = links.findIndex((link) => link === document.activeElement);
    if (index < 0) return;
    // The grid's width decides how many goals are in a row: count those level with the first.
    const columns = Math.max(1, links.filter((link) => link.offsetTop === links[0]?.offsetTop).length);
    const target: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + columns,
      ArrowUp: index - columns,
      Home: 0,
      End: links.length - 1,
    };
    const wanted = target[event.key];
    if (wanted === undefined) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(links.length - 1, wanted));
    setStop(next);
    links[next]?.focus();
  };

  return (
    <section aria-labelledby="chooser-title" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col items-start gap-2">
        {lastStudio && lastStudio.href !== "/" ? (
          <Link
            href={lastStudio.href}
            className="group mb-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-raised hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            <span>{t("home.continue", { studio: t(`studio.${lastStudio.id}.title`) })}</span>
            <ArrowUpRight
              className="size-3 text-subtle-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden
            />
          </Link>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle-foreground">
          <Message id="home.chooser.eyebrow" />
        </p>
        <h2 id="chooser-title" className="text-3xl font-medium md:text-4xl">
          <Message id="home.chooser.title" />
        </h2>
      </div>
      <ul ref={list} onKeyDown={move} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {goals.map((goal, position) => {
          const studio = getStudio(goal.studio);
          const Icon = studio.icon;
          return (
            <li key={goal.id}>
              <Link
                href={studio.href}
                data-goal={goal.id}
                tabIndex={position === stop ? 0 : -1}
                onFocus={() => setStop(position)}
                className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-surface-raised focus-visible:border-ring"
              >
                <span className="flex items-center justify-between gap-3">
                  <Icon className="size-5 text-brand" aria-hidden />
                  {kept.has(studio.href) ? (
                    <span
                      role="img"
                      aria-label={t("nav.kept")}
                      title={t("nav.kept")}
                      data-kept
                      className="ml-auto mr-2 size-1.5 rounded-full bg-success"
                    />
                  ) : null}
                  <ArrowUpRight
                    className="size-4 text-subtle-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </span>
                <span className="text-base font-medium">
                  <Message id={`home.goal.${goal.id}.title`} />
                </span>
                <span className="text-sm text-muted-foreground">
                  <Message id={`home.goal.${goal.id}.body`} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {returning ? (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((value) => !value)}
          className="self-start rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Message id={showAll ? "home.chooser.fewer" : "home.chooser.more"} />
        </button>
      ) : null}
    </section>
  );
}
