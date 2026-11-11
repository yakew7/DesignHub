"use client";

import { Code2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseCssImport, planCssImport } from "@/lib/brand/import-css";
import { toHex } from "@/lib/color/color";
import { applySnapshot, captureSnapshot } from "@/lib/projects/snapshot";
import { loadFontIndex } from "@/lib/typography/catalog";
import { MAX_SWATCHES, MIN_SWATCHES, createSwatch, useColorStore } from "@/store/color-store";
import { useTypographyStore } from "@/store/typography-store";

const MAX_CSS_LENGTH = 500_000;
const CSS_PLACEHOLDER = ":root { --brand: #4f46e5; }\nbody { font-family: Inter, sans-serif; }";

/** Imports colors and fonts from pasted CSS, with a preview and undo. Only the color and typography stores change. */
export function ImportCssButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [css, setCss] = useState("");
  const [families, setFamilies] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!open || families) return;
    let cancelled = false;
    void loadFontIndex().then((catalog) => {
      if (!cancelled) setFamilies(new Set(catalog.map((font) => font.family)));
    });
    return () => {
      cancelled = true;
    };
  }, [open, families]);

  const tooLarge = css.length > MAX_CSS_LENGTH;
  const found = useMemo(
    () =>
      !css.trim() || tooLarge ? null : parseCssImport(css, { isKnownFont: (name) => families?.has(name) ?? true }),
    [css, tooLarge, families],
  );
  const plan = useMemo(() => (found ? planCssImport(found) : null), [found]);
  const hasContent = Boolean(found && (found.colors.length > 0 || found.fonts.length > 0));
  const canApply = Boolean(plan && (plan.palette || plan.headingFont || plan.bodyFont));

  function apply() {
    if (!plan || !canApply) return;
    const before = captureSnapshot();
    if (plan.palette) useColorStore.getState().setSwatches(plan.palette.map((color) => createSwatch(color)));
    if (plan.headingFont || plan.bodyFont) {
      useTypographyStore
        .getState()
        .setPair({ heading: plan.headingFont ?? undefined, body: plan.bodyFont ?? undefined });
    }
    const lines = [
      plan.palette ? t("brand.import.summary.colors", { count: plan.palette.length }) : null,
      plan.headingFont ? t("brand.import.summary.headingFont", { name: plan.headingFont }) : null,
      plan.bodyFont ? t("brand.import.summary.bodyFont", { name: plan.bodyFont }) : null,
    ].filter(Boolean);
    toast.success(t("brand.css.done"), {
      description: lines.join(" · "),
      action: { label: t("common.undo"), onClick: () => applySnapshot(before) },
    });
    setOpen(false);
    setCss("");
  }

  let message: string | null = null;
  if (!css.trim()) message = t("brand.css.emptyInput");
  else if (tooLarge) message = t("brand.css.tooLarge");
  else if (!hasContent) message = t("brand.css.nothingFound");

  return (
    <>
      <Button
        variant="outline"
        className="h-auto min-h-9 w-full whitespace-normal py-1.5"
        onClick={() => setOpen(true)}
        title={t("brand.css.hint")}
      >
        <Code2 /> {t("brand.css.button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("brand.css.title")}</DialogTitle>
            <DialogDescription>{t("brand.css.description")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={css}
            onChange={(event) => setCss(event.target.value)}
            aria-label={t("brand.css.label")}
            placeholder={CSS_PLACEHOLDER}
            spellCheck={false}
            className="h-40 font-mono text-xs"
          />
          {message ? (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}
          {found && plan && hasContent ? (
            <div className="grid gap-4" data-testid="css-import-preview">
              {found.colors.length > 0 ? (
                <section className="grid gap-2">
                  <h3 className="text-sm font-medium">{t("brand.css.colors", { count: found.colors.length })}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {found.colors.map((entry, index) => (
                      <li
                        key={entry.hex}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
                          index >= MAX_SWATCHES || !plan.palette ? "opacity-50" : ""
                        }`}
                      >
                        <span
                          className="size-4 rounded-sm border"
                          style={{ backgroundColor: toHex(entry.color) }}
                          aria-hidden
                        />
                        <span className="font-mono">{entry.hex}</span>
                        <span className="text-muted-foreground">{t("brand.css.uses", { count: entry.count })}</span>
                      </li>
                    ))}
                  </ul>
                  {found.colors.length < MIN_SWATCHES ? (
                    <p className="text-xs text-muted-foreground">
                      {t("brand.css.tooFewColors", { count: found.colors.length, min: MIN_SWATCHES })}
                    </p>
                  ) : null}
                  {plan.extraColors > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("brand.css.extraColors", { max: MAX_SWATCHES, count: found.colors.length })}
                    </p>
                  ) : null}
                </section>
              ) : null}
              {found.fonts.length > 0 ? (
                <section className="grid gap-2">
                  <h3 className="text-sm font-medium">{t("brand.css.fonts", { count: found.fonts.length })}</h3>
                  <ul className="grid gap-1">
                    {found.fonts.map((font) => {
                      const status = !font.known
                        ? t("brand.css.font.skipped")
                        : font.family === plan.headingFont
                          ? t("brand.css.role.heading")
                          : font.family === plan.bodyFont
                            ? t("brand.css.role.body")
                            : t("brand.css.font.unused");
                      return (
                        <li key={font.family} className="flex items-center justify-between gap-2 text-sm">
                          <span className={font.known ? "" : "text-muted-foreground"}>{font.family}</span>
                          <span className="text-xs text-muted-foreground">
                            {t("brand.css.uses", { count: font.count })} · {status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
              {found.ignored > 0 ? (
                <p className="text-xs text-muted-foreground">{t("brand.css.ignored", { count: found.ignored })}</p>
              ) : null}
              {!canApply ? <p className="text-sm text-muted-foreground">{t("brand.css.nothingToApply")}</p> : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={apply} disabled={!canApply}>
              {t("brand.css.apply")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
