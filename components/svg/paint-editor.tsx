"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type PaintEditorProps = {
  attributes: Record<string, string>;
  onChange: (patch: Record<string, string | null>) => void;
  idPrefix: string;
};

const isHex = (value: string | undefined) => Boolean(value && /^#[\da-f]{3}([\da-f]{3})?$/i.test(value));

function PaintRow({
  label,
  name,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  name: "fill" | "stroke";
  value?: string;
  onChange: PaintEditorProps["onChange"];
  idPrefix: string;
}) {
  const { t } = useI18n();
  const id = `${idPrefix}-${name}`;
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="w-12 shrink-0">
        {label}
      </Label>
      <label
        className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-checker"
        title={t("svg.paint.pick")}
      >
        <span className="absolute inset-0" style={{ background: isHex(value) ? value : "transparent" }} />
        <input
          type="color"
          aria-label={t("svg.paint.color", { label })}
          value={isHex(value) && value?.length === 7 ? value : "#000000"}
          onChange={(event) => onChange({ [name]: event.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Input
        id={id}
        value={value ?? ""}
        placeholder={t("svg.paint.inherit")}
        onChange={(event) => onChange({ [name]: event.target.value.trim() || null })}
        className="h-8 min-w-0 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() => onChange({ [name]: "none" })}
        className="h-8 shrink-0 rounded-md border px-2 text-[11px] text-muted-foreground hover:text-foreground"
      >
        {t("svg.paint.none")}
      </button>
    </div>
  );
}

/** Fill, stroke, stroke width and opacity for one element or the whole document. */
export function PaintEditor({ attributes, onChange, idPrefix }: PaintEditorProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2.5">
      <PaintRow
        label={t("svg.paint.fill")}
        name="fill"
        value={attributes.fill}
        onChange={onChange}
        idPrefix={idPrefix}
      />
      <PaintRow
        label={t("svg.paint.stroke")}
        name="stroke"
        value={attributes.stroke}
        onChange={onChange}
        idPrefix={idPrefix}
      />
      <div className="grid grid-cols-2 gap-2">
        {(["stroke-width", "opacity"] as const).map((name) => (
          <div key={name} className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-${name}`}>{name}</Label>
            <Input
              id={`${idPrefix}-${name}`}
              type="number"
              step={name === "opacity" ? 0.05 : 0.5}
              min={0}
              max={name === "opacity" ? 1 : undefined}
              value={attributes[name] ?? ""}
              placeholder={t("svg.paint.inherit")}
              onChange={(event) => onChange({ [name]: event.target.value || null })}
              className="h-8 font-mono text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
