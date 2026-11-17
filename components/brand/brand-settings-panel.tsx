"use client";

import "@/lib/i18n/areas/brand";

import { BrandColorsField } from "@/components/brand/fields/brand-colors-field";
import { BrandIdentityFields } from "@/components/brand/fields/brand-identity-fields";
import { BrandLogoField } from "@/components/brand/fields/brand-logo-field";
import { BrandScaleFields } from "@/components/brand/fields/brand-scale-fields";
import { BrandTypeFields } from "@/components/brand/fields/brand-type-fields";
import { ImportCssButton } from "@/components/brand/import-css-button";
import { ImportTokensButton } from "@/components/brand/import-tokens-button";
import { useI18n } from "@/components/layout/locale-provider";
import { ShareLinkButton } from "@/components/brand/share-link-button";
import { SurpriseButton } from "@/components/brand/surprise-button";
import { Panel } from "@/components/ui/panel";

export function BrandSettingsPanel() {
  const { t } = useI18n();
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <SurpriseButton />
        <ImportTokensButton />
        <ImportCssButton />
        <ShareLinkButton />
      </div>
      <Panel id="brand-identity" collapsible title={t("brand.panel.identity")}>
        <BrandIdentityFields />
        <BrandLogoField />
      </Panel>
      <Panel id="brand-colors" collapsible title={t("brand.panel.colors")} description={t("brand.panel.colorsHint")}>
        <BrandColorsField />
      </Panel>
      <Panel
        id="brand-typography"
        collapsible
        title={t("brand.panel.typography")}
        description={t("brand.panel.typographyHint")}
      >
        <BrandTypeFields />
      </Panel>
      <Panel id="brand-shape" collapsible defaultOpen={false} title={t("brand.panel.shape")}>
        <BrandScaleFields />
      </Panel>
    </>
  );
}
