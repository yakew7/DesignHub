"use client";

import { RotateCcw } from "lucide-react";

import { Advanced } from "@/components/ui/advanced";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/ui/section";
import { Panel } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBrandStore } from "@/store/brand-store";
import { useTokensStore } from "@/store/tokens-store";
import type { ColorFormat } from "@/types/color";
import type { TokenSections } from "@/types/tokens";

const sectionLabels: Record<keyof TokenSections, string> = {
  colors: "Colors",
  shades: "Shades 50–950",
  gradient: "Gradient",
  typography: "Typography",
  spacing: "Spacing",
  radius: "Radius",
  effects: "Effects (shadows, blur)",
};

export function TokenSettingsPanel() {
  const settings = useTokensStore((state) => state.settings);
  const update = useTokensStore((state) => state.update);
  const toggleSection = useTokensStore((state) => state.toggleSection);
  const reset = useTokensStore((state) => state.reset);
  const brandName = useBrandStore((state) => state.profile.name);
  const updateProfile = useBrandStore((state) => state.updateProfile);

  return (
    <Panel
      title="Settings"
      actions={
        <Button variant="ghost" size="icon" aria-label="Reset export settings" onClick={reset}>
          <RotateCcw />
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="token-name">Brand name</Label>
        <Input id="token-name" value={brandName} onChange={(event) => updateProfile({ name: event.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="token-prefix">Variable prefix</Label>
        <Input
          id="token-prefix"
          value={settings.prefix}
          placeholder="e.g. dh → --dh-color-primary"
          onChange={(event) => update({ prefix: event.target.value })}
          className="font-mono"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Color notation</Label>
        <ToggleGroup
          type="single"
          value={settings.colorFormat}
          onValueChange={(value) => value && update({ colorFormat: value as ColorFormat })}
          aria-label="Color notation"
          className="w-full"
        >
          {(["hex", "rgb", "hsl", "oklch"] as const).map((format) => (
            <ToggleGroupItem key={format} value={format} className="flex-1 font-mono uppercase">
              {format}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Advanced>
        <SliderField
          label="Spacing base"
          value={settings.spacingBase}
          min={2}
          max={12}
          onChange={(spacingBase) => update({ spacingBase })}
          format={(value) => `${value}px`}
        />
        <SliderField
          label="Radius base"
          value={settings.radiusBase}
          min={0}
          max={24}
          onChange={(radiusBase) => update({ radiusBase })}
          format={(value) => `${value}px`}
        />
        <Section id="export-settings-include" title="Include">
          <fieldset aria-label="Include" className="flex flex-col gap-2">
            {(Object.keys(sectionLabels) as (keyof TokenSections)[]).map((section) => (
              <div key={section} className="flex items-center justify-between">
                <Label htmlFor={`section-${section}`}>{sectionLabels[section]}</Label>
                <Switch
                  id={`section-${section}`}
                  checked={settings.sections[section] ?? true}
                  onCheckedChange={() => toggleSection(section)}
                  disabled={section === "shades" && !settings.sections.colors}
                />
              </div>
            ))}
          </fieldset>
        </Section>
      </Advanced>
    </Panel>
  );
}
