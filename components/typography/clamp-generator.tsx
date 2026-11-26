"use client";

import { useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { fluidClamp } from "@/lib/typography/scale";

type ClampInputs = { minSize: number; maxSize: number; minViewport: number; maxViewport: number };

const fields: { key: keyof ClampInputs; label: string }[] = [
  { key: "minSize", label: "Min size (px)" },
  { key: "maxSize", label: "Max size (px)" },
  { key: "minViewport", label: "Min viewport (px)" },
  { key: "maxViewport", label: "Max viewport (px)" },
];

/** Standalone clamp() calculator for any fluid value - font sizes, spacing, gaps. */
export function ClampGenerator() {
  const { t } = useI18n();
  const [inputs, setInputs] = useState<ClampInputs>({ minSize: 32, maxSize: 64, minViewport: 360, maxViewport: 1280 });
  const value = fluidClamp(inputs.minSize, inputs.maxSize, inputs.minViewport, inputs.maxViewport);

  return (
    <Panel
      advanced
      collapsible
      id="typography-clamp"
      defaultOpen={false}
      title={t("typography.clamp.title")}
      description="Fluid values for anything: type, spacing, radii."
    >
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <Label htmlFor={`clamp-${field.key}`}>{field.label}</Label>
            <Input
              id={`clamp-${field.key}`}
              type="number"
              inputMode="decimal"
              min={0}
              value={inputs[field.key]}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) setInputs((current) => ({ ...current, [field.key]: next }));
              }}
              className="font-mono tabular-nums"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-md border bg-surface p-2">
        <code className="flex-1 px-1 font-mono text-xs break-all">{value}</code>
        <CopyButton value={value} label="Copy clamp value" className="size-7" />
      </div>
    </Panel>
  );
}
