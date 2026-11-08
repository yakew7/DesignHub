"use client";

import { Moon, Sun } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAdvanced } from "@/components/ui/advanced";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MessageKey } from "@/lib/i18n/translate";
import type { MockupContent } from "@/lib/mockups/types";
import { useMockupStore } from "@/store/mockup-store";
import type { BrandMode } from "@/types/brand";

const fields = [
  { key: "headline", label: "mockups.field.headline" },
  { key: "cta", label: "mockups.field.cta" },
  { key: "person", label: "mockups.field.person" },
  { key: "role", label: "mockups.field.role" },
  { key: "email", label: "mockups.field.email" },
  { key: "phone", label: "mockups.field.phone" },
  { key: "website", label: "mockups.field.website" },
  { key: "address", label: "mockups.field.address" },
] as const satisfies readonly { key: keyof MockupContent; label: MessageKey }[];

/** Contact details are Advanced: the headline, the call to action and the person are what most sessions edit. */
const advancedFields: (keyof MockupContent)[] = ["email", "phone", "website", "address"];

export function MockupContentPanel() {
  const { t } = useI18n();
  const advanced = useIsAdvanced();
  const mode = useMockupStore((state) => state.mode);
  const setMode = useMockupStore((state) => state.setMode);
  const content = useMockupStore((state) => state.content);
  const setContent = useMockupStore((state) => state.setContent);

  return (
    <Panel title={t("mockups.content.title")}>
      <div className="flex flex-col gap-2">
        <Label>{t("mockups.content.theme")}</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as BrandMode)}
          aria-label={t("mockups.content.themeLabel")}
          className="w-full"
        >
          <ToggleGroupItem value="light" className="flex-1">
            <Sun /> {t("mockups.content.light")}
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" className="flex-1">
            <Moon /> {t("mockups.content.dark")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {fields
        .filter((field) => advanced || !advancedFields.includes(field.key))
        .map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`mockup-${field.key}`}>{t(field.label)}</Label>
            <Input
              id={`mockup-${field.key}`}
              value={content[field.key]}
              maxLength={80}
              placeholder={
                field.key === "headline" || field.key === "email" || field.key === "website"
                  ? t("mockups.content.fromBrand")
                  : undefined
              }
              onChange={(event) => setContent({ [field.key]: event.target.value })}
              className="h-8 text-sm"
            />
          </div>
        ))}
    </Panel>
  );
}
