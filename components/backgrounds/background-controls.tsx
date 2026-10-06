"use client";

import { Dices, RotateCcw } from "lucide-react";

import { ColorList } from "@/components/backgrounds/color-list";
import { GeneratorPicker } from "@/components/backgrounds/generator-picker";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useHotkey } from "@/hooks/use-hotkeys";
import { useBackgroundStore } from "@/store/background-store";
import type { HalftoneGradientChoice } from "@/types/background";

const sizes = [
  { id: "1600x900", label: "Desktop · 1600×900" },
  { id: "1920x1080", label: "Full HD · 1920×1080" },
  { id: "1200x630", label: "Open Graph · 1200×630" },
  { id: "1080x1080", label: "Square · 1080×1080" },
  { id: "1080x1920", label: "Story · 1080×1920" },
];

const halftoneGradients: { value: HalftoneGradientChoice; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
  { value: "seeded", label: "Seeded" },
];

export function BackgroundControls() {
  const settings = useBackgroundStore((state) => state.settings);
  const update = useBackgroundStore((state) => state.update);
  const updateOptions = useBackgroundStore((state) => state.updateOptions);
  const randomize = useBackgroundStore((state) => state.randomize);
  const reset = useBackgroundStore((state) => state.reset);
  useHotkey("space", randomize);

  return (
    <>
      <Panel title="Generator">
        <GeneratorPicker />
      </Panel>
      <Panel
        title="Controls"
        actions={
          <Button variant="ghost" size="icon" aria-label="Reset background" onClick={reset}>
            <RotateCcw />
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="bg-seed">Seed</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="bg-seed"
              type="number"
              min={1}
              value={settings.seed}
              onChange={(event) => update({ seed: Math.max(1, Number(event.target.value) || 1) })}
              className="min-w-20 flex-1 font-mono tabular-nums"
            />
            <Button variant="outline" onClick={randomize} className="shrink-0" title="Randomize · Space">
              <Dices /> Randomize
            </Button>
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-subtle-foreground">
          Press <Kbd>Space</Kbd> for a new seed.
        </p>
        {settings.kind === "halftone" && (
          <div className="flex flex-col gap-2">
            <Label>Gradient</Label>
            <ToggleGroup
              type="single"
              value={settings.options?.halftoneGradient ?? "seeded"}
              onValueChange={(value) => value && updateOptions({ halftoneGradient: value as HalftoneGradientChoice })}
              aria-label="Halftone gradient"
              className="w-full"
            >
              {halftoneGradients.map((gradient) => (
                <ToggleGroupItem key={gradient.value} value={gradient.value} className="flex-1">
                  {gradient.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        <ColorList />
        <SliderField
          label="Density"
          value={settings.density}
          min={0}
          max={100}
          onChange={(density) => update({ density })}
        />
        <SliderField
          label="Scale"
          value={settings.scale}
          min={0.25}
          max={4}
          step={0.05}
          onChange={(scale) => update({ scale })}
          format={(value) => `${value.toFixed(2)}×`}
        />
        <SliderField
          label="Rotation"
          value={settings.rotation}
          min={0}
          max={360}
          onChange={(rotation) => update({ rotation })}
          format={(value) => `${value}°`}
        />
        <div className="flex flex-col gap-2">
          <Label>Canvas</Label>
          <Select
            value={`${settings.width}x${settings.height}`}
            onValueChange={(value) => {
              const [width, height] = value.split("x").map(Number);
              if (width && height) update({ width, height });
            }}
          >
            <SelectTrigger aria-label="Canvas size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Panel>
    </>
  );
}
