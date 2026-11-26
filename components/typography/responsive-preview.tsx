"use client";

import "@/lib/i18n/areas/mockups";

import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { SliderField } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useElementWidth } from "@/hooks/use-element-width";
import { fontStack } from "@/lib/typography/css";
import { sizeAtViewport } from "@/lib/typography/scale";
import { useTypographyStore } from "@/store/typography-store";
import type { TypeScaleStep } from "@/types/typography";

const devices = [
  { id: "mobile", width: 375, label: "Mobile", icon: Smartphone },
  { id: "tablet", width: 768, label: "Tablet", icon: Tablet },
  { id: "laptop", width: 1280, label: "Laptop", icon: Laptop },
  { id: "desktop", width: 1536, label: "Desktop", icon: Monitor },
] as const;

/** Renders the fluid scale exactly as it would appear at a given viewport width. */
export function ResponsivePreview({ steps }: { steps: TypeScaleStep[] }) {
  const { t } = useI18n();
  const scale = useTypographyStore((state) => state.scale);
  const rhythm = useTypographyStore((state) => state.rhythm);
  const headingFont = useTypographyStore((state) => state.headingFont);
  const bodyFont = useTypographyStore((state) => state.bodyFont);
  const [viewport, setViewport] = useState(375);
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const zoom = width ? Math.min(1, width / viewport) : 1;
  const size = (name: string) => {
    const step = steps.find((item) => item.name === name) ?? steps[steps.length - 1];
    return step ? `${sizeAtViewport(step, viewport, scale).toFixed(2)}px` : "1rem";
  };

  const heading = (name: string): CSSProperties => ({
    fontFamily: fontStack(headingFont),
    fontSize: size(name),
    fontWeight: rhythm.headingWeight,
    lineHeight: rhythm.headingLineHeight,
    letterSpacing: `${rhythm.headingTracking}em`,
  });
  const body = (name: string): CSSProperties => ({
    fontFamily: fontStack(bodyFont),
    fontSize: size(name),
    fontWeight: rhythm.bodyWeight,
    lineHeight: rhythm.bodyLineHeight,
    letterSpacing: `${rhythm.bodyTracking}em`,
  });
  const active = devices.find((device) => device.width === viewport)?.id ?? "";

  return (
    <section
      aria-label={t("typography.responsive.title")}
      className="flex flex-col gap-4 rounded-lg border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-medium">{t("typography.responsive.title")}</h2>
        <ToggleGroup
          type="single"
          value={active}
          onValueChange={(id) => {
            const device = devices.find((item) => item.id === id);
            if (device) setViewport(device.width);
          }}
          aria-label={t("typography.responsive.viewport")}
        >
          {devices.map(({ id, label: english, icon: Icon, width: deviceWidth }) => {
            const label = id === "tablet" ? t("mockups.template.tablet") : english;
            return (
              <ToggleGroupItem
                key={id}
                value={id}
                aria-label={`${label} (${deviceWidth}px)`}
                title={`${label} · ${deviceWidth}px`}
              >
                <Icon />
                <span className="hidden sm:inline">{label}</span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
      <SliderField
        label="Viewport width"
        value={viewport}
        min={320}
        max={1920}
        step={1}
        onChange={setViewport}
        format={(v) => `${v}px`}
      />
      <div ref={ref} className="overflow-hidden rounded-md border bg-background">
        <div style={{ width: viewport, zoom }} className="px-6 py-8">
          <p style={body("sm")} className="font-semibold tracking-widest text-brand uppercase">
            {t("typography.responsive.kicker")}
          </p>
          <h1 style={heading("4xl")} className="mt-3 text-foreground">
            {t("typography.responsive.title.sample")}
          </h1>
          <p style={body("lg")} className="mt-4 text-muted-foreground">
            {t("typography.responsive.lead")}
          </p>
          <h2 style={heading("2xl")} className="mt-8">
            {t("typography.responsive.heading1")}
          </h2>
          <p style={body("base")} className="mt-3 max-w-[65ch]">
            {t("typography.responsive.body1")}
          </p>
          <h3 style={heading("xl")} className="mt-6">
            {t("typography.responsive.heading2")}
          </h3>
          <p style={body("base")} className="mt-3 max-w-[65ch]">
            {t("typography.responsive.body2")}
          </p>
          <p style={body("xs")} className="mt-6 text-subtle-foreground">
            {t("typography.responsive.rendered", { viewport, size: size("base") })}
          </p>
        </div>
      </div>
    </section>
  );
}
