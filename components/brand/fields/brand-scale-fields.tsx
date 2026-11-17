"use client";

import "@/lib/i18n/areas/brand";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { PlainMessageKey } from "@/lib/i18n/translate";
import { shadowPresets } from "@/lib/effects/shadow";
import { useEffectsStore } from "@/store/effects-store";
import { useTokensStore } from "@/store/tokens-store";

const shadowLabels = {
  subtle: "brand.shadow.subtle",
  smooth: "brand.shadow.smooth",
  elevated: "brand.shadow.elevated",
  sharp: "brand.shadow.sharp",
  inner: "brand.shadow.inner",
  hairline: "brand.shadow.hairline",
  card: "brand.shadow.card",
  material: "brand.shadow.material",
  floating: "brand.shadow.floating",
  dramatic: "brand.shadow.dramatic",
  brutal: "brand.shadow.brutal",
  long: "brand.shadow.long",
  glow: "brand.shadow.glow",
  pressed: "brand.shadow.pressed",
  ring: "brand.shadow.ring",
} as const satisfies Record<string, PlainMessageKey>;

export function BrandScaleFields() {
  const { t } = useI18n();
  const radius = useTokensStore((state) => state.settings.radiusBase);
  const spacing = useTokensStore((state) => state.settings.spacingBase);
  const updateTokens = useTokensStore((state) => state.update);
  const updateEffect = useEffectsStore((state) => state.update);

  return (
    <>
      <SliderField
        label={t("brand.scale.radius")}
        value={radius}
        min={0}
        max={32}
        onChange={(radiusBase) => updateTokens({ radiusBase })}
        format={(v) => `${v}px`}
      />
      <SliderField
        label={t("brand.scale.spacing")}
        value={spacing}
        min={2}
        max={12}
        onChange={(spacingBase) => updateTokens({ spacingBase })}
        format={(v) => `${v}px`}
      />
      <div className="flex flex-col gap-2">
        <Label>{t("brand.scale.shadow")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {shadowPresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => updateEffect("shadow", { layers: preset.layers() })}
            >
              {preset.id in shadowLabels ? t(shadowLabels[preset.id as keyof typeof shadowLabels]) : preset.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
