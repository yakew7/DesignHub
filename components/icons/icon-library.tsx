"use client";

import { useState } from "react";

import { CollectionPicker } from "@/components/icons/collection-picker";
import { IconGrid, IconsError } from "@/components/icons/icon-grid";
import { IconSearch } from "@/components/icons/icon-search";
import { Button } from "@/components/ui/button";
import { iconSearchSuggestions, iconTopics } from "@/lib/icons/topics";
import { cn } from "@/lib/utils";
import { useIconResults } from "@/hooks/use-icon-results";
import { useIconStore } from "@/store/icon-store";

const PAGE = 240;

export function IconLibrary() {
  const query = useIconStore((state) => state.query);
  const setQuery = useIconStore((state) => state.setQuery);
  const prefix = useIconStore((state) => state.prefix);
  const setPrefix = useIconStore((state) => state.setPrefix);
  const favorites = useIconStore((state) => state.favorites);
  const results = useIconResults(query, prefix);
  const [limit, setLimit] = useState({ key: "", count: PAGE });
  const [topicId, setTopicId] = useState<string | null>(null);
  const topic = results.mode === "featured" ? iconTopics.find((item) => item.id === topicId) : undefined;

  // Reset pagination whenever the result set changes.
  const resultKey = `${results.mode}:${query}:${prefix}`;
  const count = limit.key === resultKey ? limit.count : PAGE;
  const ids = topic ? topic.icons : results.ids;
  const shown = ids.slice(0, count);

  const heading =
    results.mode === "search"
      ? `${results.total.toLocaleString()} results for “${query.trim()}”`
      : results.mode === "collection"
        ? `${results.total.toLocaleString()} icons`
        : (topic?.label ?? "Featured");

  return (
    <section aria-label="Icon library" className="flex min-w-0 flex-col gap-4">
      <IconSearch />
      <CollectionPicker value={prefix} onChange={setPrefix} />

      {results.mode === "featured" ? (
        <div className="flex flex-col gap-2.5">
          <div role="radiogroup" aria-label="Browse by topic" className="flex flex-wrap gap-1.5">
            {[{ id: null, label: "Featured" }, ...iconTopics].map((item) => (
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
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle-foreground">
            Try
            {iconSearchSuggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="rounded-sm text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
              >
                {term}
              </button>
            ))}
          </p>
        </div>
      ) : null}

      {results.mode === "featured" && !topic && favorites.length ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Favorites</h2>
          <IconGrid ids={favorites} />
        </div>
      ) : null}

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium" aria-live="polite">
          {results.loading ? "Searching…" : heading}
        </h2>
        {results.mode === "search" && results.total >= 240 ? (
          <p className="text-xs text-subtle-foreground">Showing the top 240. Refine your search or pick a set.</p>
        ) : null}
      </div>
      {results.error ? (
        <IconsError onRetry={results.retry} />
      ) : (
        <IconGrid ids={shown} emptyMessage="No icons match. Try a broader term or another set." />
      )}
      {ids.length > count ? (
        <Button
          variant="outline"
          className="self-center"
          onClick={() => setLimit({ key: resultKey, count: count + PAGE })}
        >
          Show more · {(ids.length - count).toLocaleString()} remaining
        </Button>
      ) : null}
    </section>
  );
}
