"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FAVICON_PREVIEW_SIZES, TAB_THEMES, faviconSvg } from "@/lib/logo/favicon-preview";
import type { VariantContext } from "@/lib/logo/variants";

/** The favicon at 16 and 32 px in a light and a dark browser tab, drawn from the same SVG as the favicon package. */
export function FaviconTabs({ ctx }: { ctx: VariantContext }) {
  const { t } = useI18n();
  const icon = faviconSvg(ctx);

  return (
    <section aria-label={t("logo.favicon.title")} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{t("logo.favicon.title")}</h3>
      <div className="grid gap-3">
        {TAB_THEMES.map((theme) => (
          <figure key={theme.id} className="flex flex-col gap-1.5">
            <div className="flex items-end gap-2 rounded-md border px-3 pt-3" style={{ background: theme.strip }}>
              {FAVICON_PREVIEW_SIZES.map((size) => (
                <div
                  key={size}
                  className="flex min-w-0 items-center gap-2 rounded-t-lg px-3 py-2.5 text-xs"
                  style={{ background: theme.tab, color: theme.text }}
                >
                  <span className="flex shrink-0 items-center" style={{ width: size, height: size }}>
                    <BrandLogo svg={icon} className="size-full" />
                  </span>
                  <span className="truncate">{ctx.name}</span>
                  <span className="shrink-0 font-mono text-[10px] opacity-80">{size}px</span>
                </div>
              ))}
            </div>
            <figcaption className="text-xs text-muted-foreground">
              {t("logo.favicon.caption", {
                theme: t(`logo.favicon.${theme.id}`),
                sizes: FAVICON_PREVIEW_SIZES.join(" px, "),
              })}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
