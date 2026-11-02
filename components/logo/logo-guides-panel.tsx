"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { SwitchField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLogoStore, type LogoBackdrop } from "@/store/logo-store";

const backdrops = ["checker", "light", "dark", "brand"] as const satisfies readonly LogoBackdrop[];

export function LogoGuidesPanel() {
  const { t } = useI18n();
  const guides = useLogoStore((state) => state.guides);
  const toggleGuide = useLogoStore((state) => state.toggleGuide);
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const setClearSpace = useLogoStore((state) => state.setClearSpace);
  const backdrop = useLogoStore((state) => state.backdrop);
  const setBackdrop = useLogoStore((state) => state.setBackdrop);

  return (
    <Panel collapsible advanced id="logo-guides" title={t("logo.guides.title")}>
      <SwitchField label={t("logo.guides.grid")} checked={guides.grid} onChange={() => toggleGuide("grid")} />
      <SwitchField
        label={t("logo.guides.clearSpace")}
        checked={guides.clearSpace}
        onChange={() => toggleGuide("clearSpace")}
      />
      <SwitchField
        label={t("logo.guides.safeArea")}
        checked={guides.safeArea}
        onChange={() => toggleGuide("safeArea")}
      />
      <SliderField
        label={t("logo.guides.clearSpaceSize")}
        value={clearSpace}
        min={0.1}
        max={0.5}
        step={0.05}
        onChange={setClearSpace}
        format={(value) => t("logo.guides.clearSpaceValue", { percent: Math.round(value * 100) })}
      />
      <div className="flex flex-col gap-2">
        <Label>{t("logo.guides.background")}</Label>
        <ToggleGroup
          type="single"
          value={backdrop}
          onValueChange={(value) => value && setBackdrop(value as LogoBackdrop)}
          aria-label={t("logo.guides.backgroundLabel")}
          className="w-full"
        >
          {backdrops.map((item) => (
            <ToggleGroupItem key={item} value={item} className="flex-1">
              {t(`logo.guides.backdrop.${item}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </Panel>
  );
}
