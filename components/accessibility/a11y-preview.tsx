"use client";

import type { CSSProperties } from "react";

import { ScrambledText } from "@/components/accessibility/scrambled-text";
import { useI18n } from "@/components/layout/locale-provider";
import { paragraphSpacingPx, withTextSpacing } from "@/lib/a11y/text-spacing";
import { fontStack } from "@/lib/typography/css";
import { useA11yStore } from "@/store/a11y-store";

/** A small but realistic UI: the thing every check in the lab is measured against. */
export function A11yPreview({ style, compact = false }: { style?: CSSProperties; compact?: boolean }) {
  const { t } = useI18n();
  const colors = useA11yStore((state) => state.colors);
  const set = useA11yStore((state) => state.typography);
  const spacingTest = useA11yStore((state) => state.textSpacingTest);
  // The test applies the WCAG 1.4.12 values on top of the chosen typography, never below it.
  const typography = spacingTest ? withTextSpacing(set) : set;
  const sample = useA11yStore((state) => state.sample);
  const scramble = useA11yStore((state) => state.dyslexiaSimulation);

  const read = t("a11y.preview.read", { link: "{link}" }).split("{link}");

  const text: CSSProperties = {
    fontFamily: fontStack(typography.family),
    fontSize: typography.size,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacing}em`,
    wordSpacing: `${typography.wordSpacing}em`,
    fontWeight: typography.weight,
    maxWidth: typography.measure,
    ...(spacingTest ? { marginBottom: paragraphSpacingPx(typography.size) } : {}),
  };

  return (
    <div
      data-a11y-preview
      className="flex flex-col gap-4 rounded-lg border"
      style={{ background: colors.background, color: colors.text, padding: compact ? 16 : 32, ...style }}
    >
      <p
        style={{ ...text, fontSize: typography.size * 0.8, fontWeight: 600, letterSpacing: "0.08em" }}
        className="uppercase"
      >
        {t("studio.accessibility.title")}
      </p>
      <h3 style={{ ...text, fontSize: typography.size * 2, lineHeight: 1.15, fontWeight: 700 }}>
        {t("a11y.preview.heading")}
      </h3>
      {compact ? null : <p style={text}>{scramble ? <ScrambledText text={sample} /> : sample}</p>}
      <p style={text}>
        {read[0]}
        <a
          href="#preview"
          onClick={(event) => event.preventDefault()}
          style={{ color: colors.accent, textDecoration: "underline" }}
        >
          {t("a11y.preview.link")}
        </a>
        {read[1]}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span
          style={{ background: colors.accent, color: colors.onAccent, fontFamily: text.fontFamily }}
          className="rounded-md px-4 py-2.5 text-sm font-semibold"
        >
          {t("a11y.preview.primary")}
        </span>
        <span
          style={{ borderColor: colors.accent, color: colors.accent, fontFamily: text.fontFamily }}
          className="rounded-md border-2 px-4 py-2 text-sm font-semibold"
        >
          {t("compare.row.secondary")}
        </span>
      </div>
      {compact ? null : (
        <label className="flex max-w-xs flex-col gap-1.5 text-sm" style={{ fontFamily: text.fontFamily }}>
          {t("a11y.preview.email")}
          <span
            className="rounded-md border-2 px-3 py-2 text-sm"
            style={{ borderColor: colors.text, opacity: 0.9 }}
            aria-hidden
          >
            you@example.com
          </span>
        </label>
      )}
    </div>
  );
}
