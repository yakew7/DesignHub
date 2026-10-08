"use client";

import { Plus, X } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase text-muted-foreground">{value}</span>
        <label className="relative size-8 cursor-pointer overflow-hidden rounded-md border">
          <span className="absolute inset-0" style={{ background: value }} />
          <input
            id={id}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const MAX_STOPS = 5;

/** Two to five gradient stops, each a color swatch; stops can be added and removed. */
export function GradientColorsField({ colors, onChange }: { colors: string[]; onChange: (colors: string[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Gradient</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {colors.map((color, index) => (
          <div key={index} className="group relative">
            <label className="relative block size-8 cursor-pointer overflow-hidden rounded-md border">
              <span className="absolute inset-0" style={{ background: color }} />
              <input
                type="color"
                aria-label={`Gradient color ${index + 1}`}
                value={color}
                onChange={(event) => onChange(colors.map((item, i) => (i === index ? event.target.value : item)))}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            {colors.length > 2 ? (
              <button
                type="button"
                aria-label={`Remove gradient color ${index + 1}`}
                onClick={() => onChange(colors.filter((_, i) => i !== index))}
                className="absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full border bg-popover group-focus-within:flex group-hover:flex"
              >
                <X className="size-2.5" />
              </button>
            ) : null}
          </div>
        ))}
        {colors.length < MAX_STOPS ? (
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Add gradient color"
            onClick={() => onChange([...colors, colors[0] ?? "#6366f1"])}
          >
            <Plus />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
