"use client";

import type { CSSProperties } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { useBrandTokens } from "@/hooks/use-brand";
import { brandSurface } from "@/lib/brand/theme";
import { fontStack } from "@/lib/typography/css";
import { scaleSize, type PairLayout } from "@/lib/typography/pair-layouts";
import type { FontCategory } from "@/types/typography";

type LayoutProps = {
  headingName: string;
  bodyName: string;
  headingCategory?: FontCategory;
  bodyCategory?: FontCategory;
};

/**
 * A font pair set in a realistic layout. Sizes come from the brand's live type scale and colors
 * from the brand's light surface, so the preview matches what the brand tokens export. The fonts
 * are the ones the pairing studio already loaded, so switching layouts requests nothing.
 */
export function PairLayoutPreview({ layout, ...fonts }: LayoutProps & { layout: PairLayout }) {
  const brand = useBrandTokens();
  const surface = brandSurface(brand, "light");
  const { scale, headingWeight, headingLineHeight, bodyLineHeight } = brand.typography;
  const size = (name: string, fallback: string) => scaleSize(scale, name, fallback);
  const heading: CSSProperties = {
    fontFamily: fontStack(fonts.headingName, fonts.headingCategory),
    fontWeight: headingWeight,
    lineHeight: headingLineHeight,
    overflowWrap: "anywhere",
    margin: 0,
  };
  const body: CSSProperties = {
    fontFamily: fontStack(fonts.bodyName, fonts.bodyCategory),
    lineHeight: bodyLineHeight,
    overflowWrap: "anywhere",
    margin: 0,
  };
  const frame: CSSProperties = { background: surface.background, color: surface.text, borderColor: surface.border };
  const props = { surface, heading, body, size };

  return (
    <div className="min-w-0 rounded-lg border p-5 md:p-10" style={frame} data-pair-layout={layout}>
      {layout === "article" ? (
        <Article {...props} />
      ) : layout === "pricing" ? (
        <Pricing {...props} />
      ) : (
        <Hero {...props} />
      )}
    </div>
  );
}

type Parts = {
  surface: ReturnType<typeof brandSurface>;
  heading: CSSProperties;
  body: CSSProperties;
  size: (name: string, fallback: string) => string;
};

function Article({ surface, heading, body, size }: Parts) {
  const { t } = useI18n();
  return (
    <article className="flex max-w-3xl flex-col gap-5">
      <p
        style={{
          ...body,
          color: surface.primaryText,
          fontSize: size("sm", "0.875rem"),
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {t("typography.sample.article.kicker")}
      </p>
      <h2 style={{ ...heading, fontSize: size("5xl", "3rem"), letterSpacing: "-0.02em" }}>
        {t("typography.sample.article.title")}
      </h2>
      <p style={{ ...body, fontSize: size("lg", "1.125rem"), color: surface.muted }}>
        {t("typography.sample.article.byline")}
      </p>
      <p style={{ ...body, fontSize: size("base", "1rem") }}>{t("typography.sample.article.intro")}</p>
      <h3 style={{ ...heading, fontSize: size("2xl", "1.5rem") }}>{t("typography.sample.article.heading")}</h3>
      <p style={{ ...body, fontSize: size("base", "1rem") }}>{t("typography.sample.article.body")}</p>
    </article>
  );
}

function Pricing({ surface, heading, body, size }: Parts) {
  const { t } = useI18n();
  const features = [
    t("typography.sample.pricing.feature.projects"),
    t("typography.sample.pricing.feature.kit"),
    t("typography.sample.pricing.feature.support"),
  ];
  return (
    <div
      className="mx-auto flex max-w-sm min-w-0 flex-col gap-4 rounded-xl border p-6"
      style={{ background: surface.surface, borderColor: surface.border }}
    >
      <p style={{ ...body, fontSize: size("sm", "0.875rem"), color: surface.primaryText, fontWeight: 600 }}>
        {t("typography.sample.pricing.badge")}
      </p>
      <h2 style={{ ...heading, fontSize: size("2xl", "1.5rem") }}>{t("typography.sample.pricing.plan")}</h2>
      <p
        style={{
          ...heading,
          fontSize: size("5xl", "3rem"),
          display: "flex",
          alignItems: "baseline",
          gap: "0.35rem",
          flexWrap: "wrap",
        }}
      >
        $24
        <span style={{ ...body, fontSize: size("sm", "0.875rem"), color: surface.muted }}>
          {t("typography.sample.pricing.period")}
        </span>
      </p>
      <p style={{ ...body, fontSize: size("base", "1rem"), color: surface.muted }}>
        {t("typography.sample.pricing.blurb")}
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {features.map((feature) => (
          <li key={feature} style={{ ...body, fontSize: size("base", "1rem") }}>
            <span aria-hidden style={{ color: surface.primaryText, marginRight: "0.5rem" }}>
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <span
        style={{
          ...body,
          fontSize: size("base", "1rem"),
          fontWeight: 600,
          background: surface.primary,
          color: surface.onPrimary,
          borderRadius: "0.5rem",
          padding: "0.65rem 1rem",
          textAlign: "center",
        }}
      >
        {t("typography.sample.pricing.cta")}
      </span>
    </div>
  );
}

function Hero({ surface, heading, body, size }: Parts) {
  const { t } = useI18n();
  return (
    <section className="flex min-w-0 flex-col items-start gap-5 py-4 md:py-10">
      <p
        style={{
          ...body,
          fontSize: size("sm", "0.875rem"),
          border: `1px solid ${surface.border}`,
          borderRadius: "999px",
          padding: "0.2rem 0.75rem",
          color: surface.muted,
        }}
      >
        {t("typography.sample.hero.badge")}
      </p>
      <h2 style={{ ...heading, fontSize: size("5xl", "3rem"), letterSpacing: "-0.03em", maxWidth: "18ch" }}>
        {t("typography.sample.hero.title")}
      </h2>
      <p style={{ ...body, fontSize: size("lg", "1.125rem"), color: surface.muted, maxWidth: "46ch" }}>
        {t("typography.sample.hero.body")}
      </p>
      <div className="flex flex-wrap gap-3">
        <span
          style={{
            ...body,
            fontSize: size("base", "1rem"),
            fontWeight: 600,
            background: surface.primary,
            color: surface.onPrimary,
            borderRadius: "0.5rem",
            padding: "0.65rem 1.1rem",
          }}
        >
          {t("typography.sample.hero.primary")}
        </span>
        <span
          style={{
            ...body,
            fontSize: size("base", "1rem"),
            fontWeight: 600,
            border: `1px solid ${surface.border}`,
            borderRadius: "0.5rem",
            padding: "0.65rem 1.1rem",
          }}
        >
          {t("typography.sample.hero.secondary")}
        </span>
      </div>
    </section>
  );
}
