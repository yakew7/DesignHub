"use client";

import { BrandColorsField } from "@/components/brand/fields/brand-colors-field";
import { BrandIdentityFields } from "@/components/brand/fields/brand-identity-fields";
import { BrandLogoField } from "@/components/brand/fields/brand-logo-field";
import { BrandScaleFields } from "@/components/brand/fields/brand-scale-fields";
import { BrandTypeFields } from "@/components/brand/fields/brand-type-fields";
import { ImportTokensButton } from "@/components/brand/import-tokens-button";
import { ShareLinkButton } from "@/components/brand/share-link-button";
import { SurpriseButton } from "@/components/brand/surprise-button";
import { Panel } from "@/components/ui/panel";

export function BrandSettingsPanel() {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <SurpriseButton />
        <ImportTokensButton />
        <ShareLinkButton />
      </div>
      <Panel title="Identity">
        <BrandIdentityFields />
        <BrandLogoField />
      </Panel>
      <Panel title="Colors" description="Edits the Color Studio palette in place.">
        <BrandColorsField />
      </Panel>
      <Panel title="Typography" description="Shared with Typography Studio.">
        <BrandTypeFields />
      </Panel>
      <Panel title="Shape & depth">
        <BrandScaleFields />
      </Panel>
    </>
  );
}
