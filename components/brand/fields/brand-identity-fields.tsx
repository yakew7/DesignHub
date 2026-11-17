"use client";

import "@/lib/i18n/areas/brand";

import { useI18n } from "@/components/layout/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBrandStore } from "@/store/brand-store";

export function BrandIdentityFields() {
  const { t } = useI18n();
  const profile = useBrandStore((state) => state.profile);
  const updateProfile = useBrandStore((state) => state.updateProfile);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-name">{t("brand.name")}</Label>
        <Input
          id="brand-name"
          value={profile.name}
          maxLength={60}
          onChange={(event) => updateProfile({ name: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-description">{t("brand.description")}</Label>
        <Textarea
          id="brand-description"
          value={profile.description}
          maxLength={240}
          onChange={(event) => updateProfile({ description: event.target.value })}
          className="min-h-16"
        />
      </div>
    </div>
  );
}
