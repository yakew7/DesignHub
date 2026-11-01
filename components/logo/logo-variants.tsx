"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FaviconTabs } from "@/components/logo/favicon-tabs";
import { PrintCheck } from "@/components/logo/print-check";
import { Input } from "@/components/ui/input";
import { useVariantContext } from "@/hooks/use-variant-context";
import { logoVariantSets } from "@/lib/logo/variant-sets";
import { invertedLockup, logoVariants, renderVariant, type LogoVariant } from "@/lib/logo/variants";
import { matchesQuery } from "@/lib/picker-search";
import { cn } from "@/lib/utils";
import { useLogoStore } from "@/store/logo-store";

const MIN_SIZES = [16, 24, 32, 48, 64];

function VariantCard({
  variant,
  svg,
  background,
  selected,
  onSelect,
}: {
  variant: LogoVariant;
  svg: string;
  background: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors duration-150 hover:border-border-strong",
          selected && "border-brand/60",
        )}
      >
        <span
          className={cn("flex h-32 items-center justify-center p-5", background === "transparent" && "bg-checker")}
          style={background === "transparent" ? undefined : { background }}
        >
          <BrandLogo svg={svg} className="max-h-full max-w-full" />
        </span>
        <span className="flex flex-col gap-0.5 border-t bg-card p-3">
          <span className="text-sm font-medium">{t(`logo.variant.${variant.id}.label`)}</span>
          <span className="text-xs text-muted-foreground">{t(`logo.variant.${variant.id}.description`)}</span>
        </span>
      </button>
    </li>
  );
}

export function LogoVariants() {
  const { t } = useI18n();
  const ctx = useVariantContext();
  const selected = useLogoStore((state) => state.variant);
  const setVariant = useLogoStore((state) => state.setVariant);
  const rendered = useMemo(
    () => new Map(logoVariants.map((variant) => [variant.id, { variant, svg: variant.render(ctx) }])),
    [ctx],
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ colors: true, lockups: true });
  const searching = query.trim().length > 0;
  const sets = useMemo(
    () =>
      logoVariantSets
        .map((set) => ({
          ...set,
          shown: set.variants.flatMap((id) => {
            const entry = rendered.get(id);
            return entry &&
              matchesQuery(
                {
                  id: entry.variant.id,
                  // Found by the name in the language shown, and by the English name too.
                  label: t(`logo.variant.${entry.variant.id}.label`),
                  description: t(`logo.variant.${entry.variant.id}.description`),
                  keywords: `${entry.variant.label} ${entry.variant.description}`,
                },
                query,
                t(`logo.set.${set.id}`),
              )
              ? [entry]
              : [];
          }),
        }))
        .filter((set) => set.shown.length > 0),
    [rendered, query, t],
  );
  const horizontal = useMemo(() => renderVariant("horizontal", ctx), [ctx]);
  const mark = useMemo(() => renderVariant("color", ctx), [ctx]);
  const inverted = useMemo(() => invertedLockup(ctx), [ctx]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3" role="group" aria-label={t("logo.variants.group")}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("logo.variants.search")}
            placeholder={t("logo.variants.search")}
            className="pl-8"
          />
        </div>
        {sets.map((set) => {
          const holdsSelection = set.variants.includes(selected);
          const expanded = searching || Boolean(open[set.id]) || holdsSelection;
          const listId = `logo-set-${set.id}`;
          return (
            <section key={set.id} className="flex flex-col gap-2">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setOpen((state) => ({ ...state, [set.id]: !expanded }))}
                className="flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform duration-150", !expanded && "-rotate-90")}
                  aria-hidden
                />
                {t(`logo.set.${set.id}`)} <span className="font-normal">({set.shown.length})</span>
              </button>
              {expanded ? (
                <ul id={listId} className="grid gap-3 sm:grid-cols-2">
                  {set.shown.map(({ variant, svg }) => (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      svg={svg}
                      background={variant.background(ctx)}
                      selected={selected === variant.id}
                      onSelect={() => setVariant(variant.id)}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
        {sets.length === 0 ? <p className="text-xs text-muted-foreground">{t("logo.variants.noMatch")}</p> : null}
      </div>

      <section aria-label={t("logo.minSize.title")} className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("logo.minSize.title")}</h3>
        <div className="flex flex-wrap items-end gap-5 rounded-lg border p-4" style={{ background: ctx.light }}>
          {MIN_SIZES.map((size) => (
            <figure key={size} className="flex flex-col items-center gap-1.5">
              <span className="flex items-end" style={{ width: size, height: size }}>
                <BrandLogo svg={mark} className="size-full" />
              </span>
              <figcaption className="font-mono text-[10px]" style={{ color: ctx.text }}>
                {size}px
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("logo.minSize.note")}</p>
      </section>

      <PrintCheck logo={ctx.logo} />

      <FaviconTabs ctx={ctx} />

      <section aria-label={t("logo.backgrounds.title")} className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("logo.backgrounds.title")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[ctx.light, ctx.dark, ctx.primary, "linear-gradient(135deg,#1e1b4b,#6366f1 60%,#f472b6)"].map(
            (background, index) => (
              <div
                key={index}
                className="flex h-24 items-center justify-center rounded-md border p-4"
                style={{ background }}
              >
                <BrandLogo svg={index === 0 ? horizontal : inverted} className="max-h-full max-w-full" />
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
