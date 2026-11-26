"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { SwitchField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { Panel } from "@/components/ui/panel";
import { TEXT_SPACING, textSpacingStatus, type BoxMetrics, type TextSpacingStatus } from "@/lib/a11y/text-spacing";
import { useA11yStore } from "@/store/a11y-store";

/** Reads every element of the preview that could clip its text. */
function measurePreview(): BoxMetrics[] {
  const root = document.querySelector("[data-a11y-preview]");
  if (!root) return [];
  return [root, ...root.querySelectorAll("*")].map((element, index) => {
    const style = getComputedStyle(element);
    return {
      id: `${element.tagName.toLowerCase()}-${index}`,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
    };
  });
}

/** WCAG 1.4.12: applies the minimum text spacing to the preview and reports whether anything is cut off. */
export function TextSpacingPanel() {
  const { t, plural } = useI18n();
  const enabled = useA11yStore((state) => state.textSpacingTest);
  const setEnabled = useA11yStore((state) => state.setTextSpacingTest);
  const typography = useA11yStore((state) => state.typography);
  const [status, setStatus] = useState<TextSpacingStatus>({ kind: "off" });

  useEffect(() => {
    if (!enabled) {
      setStatus({ kind: "off" });
      return;
    }
    // Measure after the new spacing has been laid out, and again when the font arrives.
    const measure = () => setStatus(textSpacingStatus(true, measurePreview()));
    const frame = requestAnimationFrame(measure);
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [enabled, typography]);

  return (
    <Panel
      collapsible
      id="a11y-text-spacing"
      defaultOpen={false}
      title={t("a11y.textSpacing.title")}
      description={`Applies line height ${TEXT_SPACING.lineHeight}, paragraph spacing ${TEXT_SPACING.paragraphSpacing}x, letter spacing ${TEXT_SPACING.letterSpacing}em and word spacing ${TEXT_SPACING.wordSpacing}em to the preview, never lower than your own values.`}
    >
      <SwitchField label="Test with WCAG text spacing" checked={enabled} onChange={setEnabled} />
      <p role="status" aria-live="polite" className="flex items-start gap-2 text-xs text-muted-foreground">
        {status.kind === "fits" ? (
          <>
            <Check className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
            {plural("a11y.textSpacing.fits", status.checked)}
          </>
        ) : status.kind === "clipped" ? (
          <>
            <TriangleAlert className="mt-px size-3.5 shrink-0 text-destructive" aria-hidden />
            {plural("a11y.textSpacing.clipped", status.ids.length)}
          </>
        ) : status.kind === "unknown" ? (
          "Open the preview to measure it."
        ) : (
          "Off. Turn it on to see whether your layout survives a reader's spacing."
        )}
      </p>
    </Panel>
  );
}
