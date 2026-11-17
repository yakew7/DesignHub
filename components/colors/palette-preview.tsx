"use client";

import "@/lib/i18n/areas/colors";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { useDesignTokens } from "@/hooks/use-design-tokens";
import { toHex } from "@/lib/color/color";
import { formatRatio } from "@/lib/color/contrast";
import { type PalettePreviewTheme, type PreviewSurface, palettePreviewThemes } from "@/lib/color/palette-preview";
import type { PlainMessageKey } from "@/lib/i18n/translate";

const labelKey: Record<PreviewSurface["id"], PlainMessageKey> = {
  card: "colors.export.preview.card",
  button: "colors.export.preview.button",
  link: "colors.export.preview.link",
  input: "colors.export.preview.input",
};

function ThemePanel({ theme, title }: { theme: PalettePreviewTheme; title: string }) {
  const { t } = useI18n();
  const byId = Object.fromEntries(theme.surfaces.map((surface) => [surface.id, surface])) as Partial<
    Record<PreviewSurface["id"], PreviewSurface>
  >;
  const card = byId.card;
  const button = byId.button;
  const link = byId.link;
  const input = byId.input;
  const page = toHex(theme.page);

  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-2">
      <figcaption className="text-xs font-medium text-subtle-foreground">{title}</figcaption>
      <div
        // The person's own colors, shown with their contrast ratios: some pairs are meant to fail.
        data-user-colors=""
        className="flex flex-col gap-3 rounded-lg border p-4"
        style={{ background: page, borderColor: input?.border ? toHex(input.border) : undefined }}
      >
        {card ? (
          <div
            className="flex flex-col gap-1 rounded-md border p-3 shadow-sm"
            style={{
              background: toHex(card.background),
              color: toHex(card.foreground),
              borderColor: input?.border ? toHex(input.border) : toHex(card.foreground),
            }}
          >
            <span className="text-sm font-semibold">{t(labelKey.card)}</span>
            <span className="font-mono text-[10px] opacity-80">
              {t("colors.export.preview.contrast", { ratio: formatRatio(card.contrast) })}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {button ? (
            <span
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold"
              style={{ background: toHex(button.background), color: toHex(button.foreground) }}
            >
              {t(labelKey.button)}
              <span className="font-mono text-[10px] font-normal opacity-80">{formatRatio(button.contrast)}</span>
            </span>
          ) : null}
          {link ? (
            <span
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: toHex(link.foreground) }}
            >
              {t(labelKey.link)}
              <span className="ml-2 font-mono text-[10px] no-underline opacity-80">{formatRatio(link.contrast)}</span>
            </span>
          ) : null}
        </div>

        {input ? (
          <label className="flex flex-col gap-1 text-xs" style={{ color: toHex(input.foreground) }}>
            <span className="font-medium">{t(labelKey.input)}</span>
            <span
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                background: toHex(input.background),
                color: toHex(input.foreground),
                borderColor: input.border ? toHex(input.border) : toHex(input.foreground),
              }}
            >
              name@brand.com
            </span>
            <span className="font-mono text-[10px] opacity-80">
              {t("colors.export.preview.contrast", { ratio: formatRatio(input.contrast) })}
            </span>
          </label>
        ) : null}
      </div>
    </figure>
  );
}

/** Live light and dark UI samples drawn from the same roleColor() mapping the exports use. */
export function PalettePreview() {
  const { t } = useI18n();
  const tokens = useDesignTokens();
  const themes = useMemo(() => palettePreviewThemes(tokens), [tokens]);

  if (themes.length === 0) return null;

  return (
    <section aria-label={t("colors.export.preview.label")} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{t("colors.export.preview.title")}</h3>
        <p className="text-xs text-subtle-foreground">{t("colors.export.preview.hint")}</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        {themes.map((theme) => (
          <ThemePanel
            key={theme.dark ? "dark" : "light"}
            theme={theme}
            title={theme.dark ? t("colors.export.preview.dark") : t("colors.export.preview.light")}
          />
        ))}
      </div>
    </section>
  );
}
