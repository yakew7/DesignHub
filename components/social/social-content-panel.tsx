"use client";

import { Moon, RotateCcw, Sun, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { svgToDataUrl } from "@/lib/icons/svg";
import type { SocialBackground, SocialContent, SocialContext } from "@/lib/social/types";
import { readSvgFile } from "@/lib/svg/read-file";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { useSocialStore } from "@/store/social-store";
import type { BrandMode } from "@/types/brand";

const textFields: { key: keyof SocialContent; label: string; derived?: boolean }[] = [
  { key: "name", label: "Project name", derived: true },
  { key: "headline", label: "Description", derived: true },
  { key: "website", label: "Website", derived: true },
  { key: "github", label: "GitHub username", derived: true },
  { key: "subtitle", label: "Tagline" },
  { key: "cta", label: "Call to action" },
  { key: "handle", label: "Social handle", derived: true },
];

const backgrounds: { value: SocialBackground; label: string }[] = [
  { value: "auto", label: "Template default" },
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "glow", label: "Glow" },
  { value: "mesh", label: "Mesh" },
];

/** Copy and look for every social template. Empty fields and unset colors follow the brand. */
export function SocialContentPanel({ ctx }: { ctx: SocialContext }) {
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
      if (!clean) throw new Error("That file isn't a valid SVG.");
      setDesign({ logoSvg: clean });
      toast.success("Logo updated for social assets");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file.");
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
            <RotateCcw /> Brand
          </Button>
        ) : (
          <span className="text-[11px] text-subtle-foreground">From brand</span>
        )}
      </div>
    </div>
  );

  return (
    <Panel title="Content" description="Every template uses these. Empty fields follow your brand.">
      <div className="grid gap-4 sm:grid-cols-2">
        {textFields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`social-${field.key}`}>{field.label}</Label>
            <Input
              id={`social-${field.key}`}
              value={content[field.key]}
              maxLength={field.key === "headline" ? 140 : 90}
              placeholder={field.derived ? String(ctx.content[field.key]) : undefined}
              onChange={(event) => setContent({ [field.key]: event.target.value })}
              className="h-8 text-sm"
            />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label>Logo</Label>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
            <img
              src={svgToDataUrl(ctx.brand.logo.svg)}
              alt="Current logo"
              className="bg-checker size-8 shrink-0 rounded-md border object-contain p-1"
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload /> Upload SVG
            </Button>
            {design.logoSvg ? (
              <Button variant="ghost" size="sm" onClick={() => setDesign({ logoSvg: null })}>
                <RotateCcw /> Brand
              </Button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            aria-label="Social logo SVG file"
            onChange={(event) => {
              void uploadLogo(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        {colorField("primary", "Primary color", ctx.surface.primary)}
        {colorField("secondary", "Secondary color", ctx.surface.secondary)}
        <div className="flex flex-col gap-1.5">
          <Label>Background style</Label>
          <Select
            value={design.background}
            onValueChange={(value) => setDesign({ background: value as SocialBackground })}
          >
            <SelectTrigger size="sm" aria-label="Background style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {backgrounds.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Theme</Label>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => value && setMode(value as BrandMode)}
            aria-label="Asset theme"
            className="w-full"
          >
            <ToggleGroupItem value="light" className="flex-1">
              <Sun /> Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" className="flex-1">
              <Moon /> Dark
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <SliderField
          label="Border radius"
          value={ctx.brand.radius}
          min={0}
          max={40}
          onChange={(radius) => setDesign({ radius })}
          format={(value) => `${value}px${design.radius === null ? " (brand)" : ""}`}
        />
        <SliderField
          label="Padding"
          value={design.padding}
          min={40}
          max={140}
          step={4}
          onChange={(padding) => setDesign({ padding })}
          format={(value) => `${value}px`}
        />
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <Label htmlFor="social-safe-area">Show safe area</Label>
          <Switch id="social-safe-area" checked={safeArea} onCheckedChange={setSafeArea} />
        </div>
      </div>
    </Panel>
  );
}
