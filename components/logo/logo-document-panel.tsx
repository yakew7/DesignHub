"use client";

import { BrandLogoField } from "@/components/brand/fields/brand-logo-field";
import { useI18n } from "@/components/layout/locale-provider";
import { Panel } from "@/components/ui/panel";

export function LogoDocumentPanel() {
  const { t } = useI18n();
  return (
    <Panel title={t("logo.document.title")} description={t("logo.document.description")}>
      <BrandLogoField />
    </Panel>
  );
}
