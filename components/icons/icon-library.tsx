"use client";

import { useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { CollectionPicker } from "@/components/icons/collection-picker";
import { IconGrid, IconsError } from "@/components/icons/icon-grid";
import { IconSearch } from "@/components/icons/icon-search";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { iconSearchSuggestions, iconTopics, topicMessageKey } from "@/lib/icons/topics";
import { cn } from "@/lib/utils";
import { SEARCH_LIMIT, useIconResults } from "@/hooks/use-icon-results";
import { useIconStore } from "@/store/icon-store";

export function IconLibrary() {
  const { t, plural } = useI18n();
  const radiosRef = useRovingRadio<HTMLDivElement>();
  const query = useIconStore((state) => state.query);
  const setQuery = useIconStore((state) => state.setQuery);
  const prefix = useIconStore((state) => state.prefix);
  const setPrefix = useIconStore((state) => state.setPrefix);
  const favorites = useIconStore((state) => state.favorites);
  const results = useIconResults(query, prefix);
  const [topicId, setTopicId] = useState<string | null>(null);
  const topic = results.mode === "featured" ? iconTopics.find((item) => item.id === topicId) : undefined;

  const ids = topic ? topic.icons : results.ids;

  const heading =
    results.mode === "search"
      ? plural("icons.library.results", results.total, { query: query.trim() })
      : results.mode === "collection"
        ? plural("icons.library.count", results.total)
        : topic
          ? t(topicMessageKey(topic.id))
          : t("icons.library.featured");

  return (
    <section aria-label={t("icons.library.label")} className="flex min-w-0 flex-col gap-4">
      <IconSearch />
      <CollectionPicker value={prefix} onChange={setPrefix} />

      {results.mode === "featured" ? (
        <div className="flex flex-col gap-2.5">
          <div
            ref={radiosRef}
            role="radiogroup"
            aria-label={t("icons.library.topics")}
            className="flex flex-wrap gap-1.5"
          >
            {[
              { id: null, label: t("icons.library.featured") },
              ...iconTopics.map((item) => ({ id: item.id, label: t(topicMessageKey(item.id)) })),
            ].map((item) => (
              <button
                key={item.id ?? "featured"}
                type="button"
                role="radio"
                aria-checked={topicId === item.id}
                onClick={() => setTopicId(item.id)}
                className={cn(
                  "h-7 rounded-full border px-3 text-xs text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
                  topicId === item.id && "border-brand/60 bg-surface-raised text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="flex flex-wrap items-center gap-1 text-xs text-subtle-foreground">
            {t("icons.library.try")}
            {iconSearchSuggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="inline-flex h-6 min-w-6 items-center rounded-md px-1.5 text-muted-foreground transition-colors duration-150 hover:bg-surface-raised hover:text-foreground"
              >
                {term}
              </button>
            ))}
          </p>
        </div>
      ) : null}

      {results.mode === "featured" && !topic && favorites.length ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t("icons.library.favorites")}</h2>
          <IconGrid ids={favorites} />
        </div>
      ) : null}

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium" aria-live="polite">
          {results.loading ? t("icons.library.searching") : heading}
        </h2>
        {results.mode === "search" && results.total >= SEARCH_LIMIT ? (
          <p className="text-xs text-subtle-foreground">{t("icons.library.limit", { count: SEARCH_LIMIT })}</p>
        ) : null}
      </div>
      {results.error ? (
        <IconsError onRetry={results.retry} />
      ) : (
        <IconGrid ids={ids} emptyMessage={t("icons.library.empty")} />
      )}
    </section>
  );
}
