"use client";

import { Moon, RotateCcw, Sun, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Advanced } from "@/components/ui/advanced";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MessageKey } from "@/lib/i18n/translate";
import { svgToDataUrl } from "@/lib/icons/svg";
import type { SocialBackground, SocialContent, SocialContext } from "@/lib/social/types";
import { readSvgFile } from "@/lib/svg/read-file";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { useSocialStore } from "@/store/social-store";
import type { BrandMode } from "@/types/brand";

const textFields = [
  { key: "name", label: "social.field.name", derived: true },
  { key: "headline", label: "social.field.headline", derived: true },
  { key: "website", label: "social.field.website", derived: true },
  { key: "github", label: "social.field.github", derived: true },
  { key: "subtitle", label: "social.field.subtitle" },
  { key: "cta", label: "social.field.cta" },
  { key: "handle", label: "social.field.handle", derived: true },
] as const satisfies readonly { key: keyof SocialContent; label: MessageKey; derived?: boolean }[];

const backgrounds = [
  { value: "auto", label: "social.design.background.auto" },
  { value: "solid", label: "social.design.background.solid" },
  { value: "gradient", label: "social.design.background.gradient" },
  { value: "glow", label: "social.design.background.glow" },
  { value: "mesh", label: "social.design.background.mesh" },
] as const satisfies readonly { value: SocialBackground; label: MessageKey }[];

/** Copy and look for every social template. Empty fields and unset colors follow the brand. */
export function SocialContentPanel({ ctx }: { ctx: SocialContext }) {
  const { t } = useI18n();
  const mode = useSocialStore((state) => state.mode);
  const setMode = useSocialStore((state) => state.setMode);
  const content = useSocialStore((state) => state.content);
  const setContent = useSocialStore((state) => state.setContent);
  const design = useSocialStore((state) => state.design);
  const setDesign = useSocialStore((state) => state.setDesign);
  const safeArea = useSocialStore((state) => state.safeArea);
  const setSafeArea = useSocialStore((state) => state.setSafeArea);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    try {
      const clean = sanitizeSvg(await readSvgFile(file));
      if (!clean) throw new Error(t("social.logo.invalid"));
      setDesign({ logoSvg: clean });
      toast.success(t("social.logo.updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("social.logo.readFailed"));
    }
  }

  const colorField = (key: "primary" | "secondary", label: string, current: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`social-${key}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border">
          <span className="absolute inset-0" style={{ background: current }} />
          <input
            id={`social-${key}`}
            type="color"
            value={current.slice(0, 7).toLowerCase()}
            onChange={(event) => setDesign({ [key]: event.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <span className="min-w-0 flex-1 font-mono text-xs uppercase">{current.slice(0, 7)}</span>
        {design[key] ? (
          <Button variant="ghost" size="sm" onClick={() => setDesign({ [key]: null })}>
            <RotateCcw /> {t("social.design.brand")}
          </Button>
        ) : (
          <span className="text-[11px] text-subtle-foreground">{t("social.design.fromBrand")}</span>
        )}
      </div>
    </div>
  );

  return (
    <Panel title={t("social.content.title")} description={t("social.content.description")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {textFields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`social-${field.key}`}>{t(field.label)}</Label>
            <Input
              id={`social-${field.key}`}
              value={content[field.key]}
              maxLength={field.key === "headline" ? 140 : 90}
              placeholder={"derived" in field ? String(ctx.content[field.key]) : undefined}
              onChange={(event) => setContent({ [field.key]: event.target.value })}
              className="h-8 text-sm"
            />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label>{t("social.logo")}</Label>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
            <img
              src={svgToDataUrl(ctx.brand.logo.svg)}
              alt={t("social.logo.current")}
              className="bg-checker size-8 shrink-0 rounded-md border object-contain p-1"
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload /> {t("social.logo.upload")}
            </Button>
            {design.logoSvg ? (
              <Button variant="ghost" size="sm" onClick={() => setDesign({ logoSvg: null })}>
                <RotateCcw /> {t("social.design.brand")}
              </Button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("social.logo.fileLabel")}
            onChange={(event) => {
              void uploadLogo(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        <Advanced>
          {colorField("primary", t("social.design.primary"), ctx.surface.primary)}
          {colorField("secondary", t("social.design.secondary"), ctx.surface.secondary)}
          <div className="flex flex-col gap-1.5">
            <Label>{t("social.design.background")}</Label>
            <Select
              value={design.background}
              onValueChange={(value) => setDesign({ background: value as SocialBackground })}
            >
              <SelectTrigger size="sm" aria-label={t("social.design.background")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {backgrounds.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {t(item.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Advanced>
        <div className="flex flex-col gap-1.5">
          <Label>{t("social.design.theme")}</Label>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => value && setMode(value as BrandMode)}
            aria-label={t("social.design.themeLabel")}
            className="w-full"
          >
            <ToggleGroupItem value="light" className="flex-1">
              <Sun /> {t("social.design.light")}
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" className="flex-1">
              <Moon /> {t("social.design.dark")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Advanced>
          <SliderField
            label={t("social.design.radius")}
            value={ctx.brand.radius}
            min={0}
            max={40}
            onChange={(radius) => setDesign({ radius })}
            format={(value) => (design.radius === null ? t("social.design.radiusBrand", { value }) : `${value}px`)}
          />
          <SliderField
            label={t("social.design.padding")}
            value={design.padding}
            min={40}
            max={140}
            step={4}
            onChange={(padding) => setDesign({ padding })}
            format={(value) => `${value}px`}
          />
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <Label htmlFor="social-safe-area">{t("social.design.safeArea")}</Label>
            <Switch id="social-safe-area" checked={safeArea} onCheckedChange={setSafeArea} />
          </div>
        </Advanced>
      </div>
    </Panel>
  );
}
