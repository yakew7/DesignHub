"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CodeBlock } from "@/components/export/code-block";
import { useI18n } from "@/components/layout/locale-provider";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { exportTiers } from "@/lib/tokens/tiers";
import { cn } from "@/lib/utils";
import type { ExportFormat, ExportTier } from "@/types/export";

/** A format with its code, or without it when `renderCode` writes the code of the open format on demand. */
export type ExportPanelFormat = Omit<ExportFormat, "code"> & { code?: string };

type ExportPanelProps = {
  formats: ExportPanelFormat[];
  label?: string;
  /** Writes the code of one format. Called for the open format only, and again only when it or this function changes. */
  renderCode?: (id: string) => string;
  /** Controls which format is open. Without it the panel keeps its own choice. */
  activeId?: string | null;
  onActiveChange?: (id: string) => void;
  /** The path that opens a format, such as `/export?format=css`. Adds a Copy link button for the open format. */
  linkPath?: (id: string) => string;
};

/** The words a search matches on: what a person would type for a format. */
function matches(format: ExportPanelFormat, query: string): boolean {
  const text = `${format.label} ${format.id} ${format.filename}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

function FormatItem({ format }: { format: ExportPanelFormat }) {
  const { t } = useI18n();
  return (
    <ToggleGroupItem value={format.id} title={format.deprecated}>
      {format.label}
      {format.deprecated ? (
        <span className="ml-1.5 rounded-sm bg-warning/15 px-1 text-[10px] font-medium text-[color-mix(in_oklch,var(--warning),black_25%)] dark:text-warning">
          {t("code.deprecated")}
        </span>
      ) : null}
    </ToggleGroupItem>
  );
}

/**
 * The picker for formats that have tiers: Core open, the others folded, a search across all of them,
 * and any group that holds the open format or a match shown. Formats with no tier come first, ungrouped.
 */
function TieredPicker({
  formats,
  active,
  onSelect,
  label,
}: {
  formats: ExportPanelFormat[];
  active: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Partial<Record<ExportTier, boolean>>>({ core: true });
  const searching = query.trim().length > 0;
  const shown = useMemo(
    () => (searching ? formats.filter((format) => matches(format, query)) : formats),
    [formats, query, searching],
  );
  const untiered = shown.filter((format) => !format.tier);
  const activeTier = formats.find((format) => format.id === active)?.tier;
  const select = (value: string) => value && onSelect(value);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("code.search")}
          placeholder={t("code.search")}
          className="pl-8"
        />
      </div>
      {untiered.length > 0 ? (
        <ToggleGroup type="single" value={active} onValueChange={select} aria-label={label} className="flex-wrap">
          {untiered.map((format) => (
            <FormatItem key={format.id} format={format} />
          ))}
        </ToggleGroup>
      ) : null}
      {exportTiers.map((tier) => {
        const inTier = shown.filter((format) => format.tier === tier);
        if (inTier.length === 0) return null;
        const expanded = searching || Boolean(open[tier]) || activeTier === tier;
        const listId = `export-tier-${tier}`;
        return (
          <div key={tier} className="flex flex-col gap-1.5">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setOpen((state) => ({ ...state, [tier]: !expanded }))}
              className="flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ChevronDown
                className={cn("size-3.5 transition-transform duration-150", !expanded && "-rotate-90")}
                aria-hidden
              />
              {t(`code.tier.${tier}`)} <span className="font-normal">({inTier.length})</span>
            </button>
            {expanded ? (
              <ToggleGroup
                id={listId}
                type="single"
                value={active}
                onValueChange={select}
                aria-label={`${label}: ${t(`code.tier.${tier}`)}`}
                className="flex-wrap"
              >
                {inTier.map((format) => (
                  <FormatItem key={format.id} format={format} />
                ))}
              </ToggleGroup>
            ) : null}
          </div>
        );
      })}
      {searching && shown.length === 0 ? <p className="text-xs text-muted-foreground">{t("code.noMatch")}</p> : null}
    </div>
  );
}

/** Format switcher + code view with one-click copy and download. */
export function ExportPanel({ formats, label, renderCode, activeId, onActiveChange, linkPath }: ExportPanelProps) {
  const { t } = useI18n();
  const [own, setOwn] = useState(formats[0]?.id ?? "");
  const active = (onActiveChange ? activeId : own) ?? "";
  const setActive = (id: string) => (onActiveChange ? onActiveChange(id) : setOwn(id));
  const format = formats.find((item) => item.id === active) ?? formats[0];
  // The address is known only in the browser.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const code = useMemo(() => format?.code ?? renderCode?.(format?.id ?? "") ?? "", [format, renderCode]);
  if (!format) return null;
  const groupLabel = label ?? t("code.format");

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {formats.some((item) => item.tier) ? (
        <TieredPicker formats={formats} active={format.id} onSelect={setActive} label={groupLabel} />
      ) : (
        <ToggleGroup
          type="single"
          value={format.id}
          onValueChange={(value) => value && setActive(value)}
          aria-label={groupLabel}
          className="flex-wrap"
        >
          {formats.map((item) => (
            <FormatItem key={item.id} format={item} />
          ))}
        </ToggleGroup>
      )}
      {format.deprecated ? (
        <p
          role="status"
          className="rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-muted-foreground"
        >
          {t("code.deprecatedNote")} {format.deprecated}
        </p>
      ) : null}
      {linkPath && origin ? (
        <CopyButton
          variant="outline"
          size="sm"
          className="self-start"
          value={`${origin}${linkPath(format.id)}`}
          toastMessage={t("code.linkCopied")}
        >
          {t("code.copyLink")}
        </CopyButton>
      ) : null}
      <CodeBlock code={code} filename={format.filename} />
    </div>
  );
}
