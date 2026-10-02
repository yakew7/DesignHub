"use client";

import { Check, Plus, X } from "lucide-react";

import { FontPicker } from "@/components/typography/font-picker";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { SliderField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFontCatalog } from "@/hooks/use-font-catalog";
import type { BrandDna } from "@/lib/brand-dna/types";
import { contrastRatio, oklch, parseColor } from "@/lib/color/color";
import { formatRatio } from "@/lib/color/contrast";
import type { ColorRole } from "@/types/brand";

type Props = { dna: BrandDna; onChange: (dna: BrandDna) => void };

const roles: ColorRole[] = ["primary", "secondary", "neutral"];

const surfaces = [
  { name: "white", color: oklch(1, 0, 0), css: "#ffffff" },
  { name: "black", color: oklch(0, 0, 0), css: "#000000" },
] as const;

/** WCAG contrast of a color as text on white and on black, so it is clear which colors can carry text. */
function SurfaceContrast({ hex }: { hex: string }) {
  const color = parseColor(hex);
  if (!color) return null;
  return (
    <span className="col-span-4 flex gap-3">
      {surfaces.map((surface) => {
        const ratio = contrastRatio(color, surface.color);
        const label = formatRatio(ratio);
        return (
          <span key={surface.name} className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
            <span
              aria-hidden
              className="flex size-3.5 items-center justify-center rounded-[3px] border text-[9px] leading-none font-semibold"
              style={{ background: surface.css, color: hex }}
            >
              A
            </span>
            <span aria-hidden>{label}</span>
            {ratio >= 4.5 && <Check aria-hidden className="size-3 text-success" />}
            <span className="sr-only">
              {`Contrast on ${surface.name}: ${label.replace(":", " to ")}${ratio >= 4.5 ? ", passes AA" : ratio >= 3 ? ", passes AA for large text only" : ", fails AA"}.`}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function DnaResultEditor({ dna, onChange }: Props) {
  const { fonts } = useFontCatalog();
  const set = (patch: Partial<BrandDna>) => onChange({ ...dna, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Colors</Label>
        <ul className="flex flex-col gap-1.5" aria-label="Extracted colors">
          {dna.colors.map((color, index) => (
            <li key={index} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 gap-y-1">
              <label className="relative row-span-2 size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border">
                <span className="absolute inset-0" style={{ background: color.hex }} />
                <input
                  type="color"
                  aria-label={`Color ${index + 1}`}
                  value={color.hex.toLowerCase()}
                  onChange={(event) =>
                    set({
                      colors: dna.colors.map((item, i) => (i === index ? { ...item, hex: event.target.value } : item)),
                    })
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <span className="truncate font-mono text-xs uppercase">
                {color.hex}
                <span className="ml-2 text-subtle-foreground">{Math.round(color.weight * 100)}%</span>
              </span>
              <CopyButton
                value={color.hex.toUpperCase()}
                label={`Copy ${color.hex.toUpperCase()}`}
                toastMessage={`Copied ${color.hex.toUpperCase()}`}
                className="size-7 shrink-0"
              />
              <Select
                value={color.role}
                onValueChange={(value) =>
                  set({
                    colors: dna.colors.map((item, i) => (i === index ? { ...item, role: value as ColorRole } : item)),
                  })
                }
              >
                <SelectTrigger size="sm" className="w-28 capitalize" aria-label={`Color ${index + 1} role`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Remove color ${index + 1}`}
                disabled={dna.colors.length <= 2}
                onClick={() => set({ colors: dna.colors.filter((_, i) => i !== index) })}
              >
                <X />
              </Button>
              <SurfaceContrast hex={color.hex} />
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          disabled={dna.colors.length >= 10}
          onClick={() => set({ colors: [...dna.colors, { hex: "#94A3B8", weight: 0, role: "neutral" }] })}
        >
          <Plus /> Add color
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Heading font</Label>
        <FontPicker label="Heading font" value={dna.heading} fonts={fonts} onChange={(heading) => set({ heading })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Body font</Label>
        <FontPicker label="Body font" value={dna.body} fonts={fonts} onChange={(body) => set({ body })} />
      </div>
      <SliderField
        label="Border radius"
        value={dna.radius}
        min={0}
        max={32}
        onChange={(radius) => set({ radius })}
        format={(v) => `${v}px`}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dna-personality">Personality</Label>
        <Input
          id="dna-personality"
          key={dna.personality.join("|")}
          defaultValue={dna.personality.join(", ")}
          onBlur={(event) =>
            set({
              personality: event.target.value
                .split(",")
                .map((word) => word.trim())
                .filter(Boolean)
                .slice(0, 4),
            })
          }
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
