"use client";

import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Advanced } from "@/components/ui/advanced";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIcon } from "@/hooks/use-icon-data";
import { useHotkey } from "@/hooks/use-hotkeys";
import { toHex } from "@/lib/color/color";
import { usesStroke } from "@/lib/icons/svg";
import { cn } from "@/lib/utils";
import { useColorStore } from "@/store/color-store";
import { useIconStore } from "@/store/icon-store";
import type { IconBackground, IconCorners } from "@/types/icons";

function ColorChoices({
  value,
  onChange,
  allowCurrent,
}: {
  value: string;
  onChange: (color: string) => void;
  allowCurrent?: boolean;
}) {
  const { t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const colors = [...new Set(swatches.map((swatch) => toHex({ ...swatch.color, alpha: 1 })))];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allowCurrent ? (
        <button
          type="button"
          onClick={() => onChange("currentColor")}
          aria-pressed={value === "currentColor"}
          className="h-7 rounded-md border px-2 font-mono text-[11px] text-muted-foreground aria-pressed:border-brand/60 aria-pressed:text-foreground"
        >
          currentColor
        </button>
      ) : null}
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={t("icons.edit.use", { color })}
          aria-pressed={value === color}
          className={cn(
            "size-7 rounded-md border ring-offset-2 ring-offset-card",
            value === color && "ring-2 ring-foreground",
          )}
          style={{ background: color }}
        />
      ))}
      <label
        className="relative size-7 cursor-pointer overflow-hidden rounded-md border bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]"
        title={t("icons.edit.custom")}
      >
        <input
          type="color"
          aria-label={t("icons.edit.custom")}
          value={value.startsWith("#") ? value.slice(0, 7) : "#6366f1"}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

export function IconControls() {
  const { t } = useI18n();
  const selected = useIconStore((state) => state.selected);
  const style = useIconStore((state) => state.style);
  const updateStyle = useIconStore((state) => state.updateStyle);
  const resetStyle = useIconStore((state) => state.resetStyle);
  const icon = useIcon(selected);
  const stroked = icon ? usesStroke(icon) : false;

  const rotateBy = (delta: number) => updateStyle({ rotate: (((style.rotate + delta) % 360) + 360) % 360 });
  useHotkey("r", () => rotateBy(90));
  useHotkey("shift+r", () => rotateBy(-90));

  const setBackground = (patch: Partial<IconBackground>) => {
    const background = { ...style.background, ...patch };
    // A glyph edge-to-edge on a shape looks cramped; give it breathing room the first time.
    const padding = background.shape !== "none" && style.padding === 0 ? 18 : style.padding;
    updateStyle({ background, padding });
  };

  return (
    <Panel
      title={t("icons.edit.title")}
      actions={
        <Button variant="ghost" size="icon" aria-label={t("icons.edit.reset")} onClick={resetStyle}>
          <RotateCcw />
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label>{t("icons.edit.color")}</Label>
        <ColorChoices value={style.color} onChange={(color) => updateStyle({ color })} allowCurrent />
      </div>

      <SliderField
        label={stroked ? t("icons.edit.stroke") : t("icons.edit.strokeFill")}
        value={style.strokeWidth ?? 2}
        min={0.5}
        max={4}
        step={0.25}
        onChange={(strokeWidth) => stroked && updateStyle({ strokeWidth })}
        format={(value) => (style.strokeWidth === null ? t("icons.edit.strokeOriginal") : value.toFixed(2))}
        className={cn(!stroked && "pointer-events-none opacity-50")}
      />

      <Advanced>
        <div className="flex flex-col gap-2">
          <Label>{t("icons.edit.corners")}</Label>
          <ToggleGroup
            type="single"
            value={style.corners}
            onValueChange={(value) => value && updateStyle({ corners: value as IconCorners })}
            aria-label={t("icons.edit.cornersLabel")}
            className="w-full"
            disabled={!stroked}
          >
            <ToggleGroupItem value="default" className="flex-1">
              {t("icons.edit.corners.default")}
            </ToggleGroupItem>
            <ToggleGroupItem value="rounded" className="flex-1">
              {t("icons.edit.corners.rounded")}
            </ToggleGroupItem>
            <ToggleGroupItem value="sharp" className="flex-1">
              {t("icons.edit.corners.sharp")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("icons.edit.transform")}</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label={t("icons.edit.rotateLeft")}
              title={t("icons.edit.rotateLeftTitle")}
              onClick={() => rotateBy(-90)}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("icons.edit.rotateRight")}
              title={t("icons.edit.rotateRightTitle")}
              onClick={() => rotateBy(90)}
            >
              <RotateCw />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("icons.edit.flipH")}
              aria-pressed={style.flipH}
              className={cn(style.flipH && "border-brand/60 text-brand")}
              onClick={() => updateStyle({ flipH: !style.flipH })}
            >
              <FlipHorizontal2 />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("icons.edit.flipV")}
              aria-pressed={style.flipV}
              className={cn(style.flipV && "border-brand/60 text-brand")}
              onClick={() => updateStyle({ flipV: !style.flipV })}
            >
              <FlipVertical2 />
            </Button>
          </div>
          <SliderField
            label={t("icons.edit.rotation")}
            value={style.rotate}
            min={0}
            max={359}
            onChange={(rotate) => updateStyle({ rotate })}
            format={(v) => `${v}°`}
          />
        </div>
      </Advanced>

      <SliderField
        label={t("icons.edit.padding")}
        value={style.padding}
        min={0}
        max={30}
        onChange={(padding) => updateStyle({ padding })}
        format={(v) => `${v}%`}
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label>{t("icons.edit.background")}</Label>
        <ToggleGroup
          type="single"
          value={style.background.shape}
          onValueChange={(value) => value && setBackground({ shape: value as IconBackground["shape"] })}
          aria-label={t("icons.edit.shapeLabel")}
          className="w-full"
        >
          {(["none", "circle", "rounded", "square"] as const).map((shape) => (
            <ToggleGroupItem key={shape} value={shape} className="flex-1 capitalize">
              {t(`icons.edit.shape.${shape}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {style.background.shape !== "none" ? (
          <ColorChoices value={style.background.color} onChange={(color) => setBackground({ color })} />
        ) : null}
      </div>
    </Panel>
  );
}
