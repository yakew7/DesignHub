"use client";

import { RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBrandTokens } from "@/hooks/use-brand";
import { errorMessage, LocalizedError } from "@/lib/i18n/errors";
import { svgToDataUrl } from "@/lib/icons/svg";
import { readSvgFile } from "@/lib/svg/read-file";
import { useBrandStore } from "@/store/brand-store";

export function BrandLogoField() {
  const { t } = useI18n();
  const brand = useBrandTokens();
  const updateProfile = useBrandStore((state) => state.updateProfile);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      // The sanitizer (an SVG parser and optimizer) loads with the first upload.
      const [source, { sanitizeSvg }] = await Promise.all([readSvgFile(file), import("@/lib/svg/sanitize")]);
      const clean = sanitizeSvg(source);
      if (!clean) throw new LocalizedError("error.svg.invalid");
      updateProfile({ logoSvg: clean });
      toast.success(t("brand.logo.updated"));
    } catch (error) {
      toast.error(errorMessage(error, t, "brand.logo.readFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("brand.logo")}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
        <img
          src={svgToDataUrl(brand.logo.svg)}
          alt={t("brand.logo.current")}
          className="bg-checker size-14 shrink-0 rounded-md border object-contain p-1.5"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload /> {t("brand.logo.upload")}
          </Button>
          {brand.logo.generated ? (
            <span className="text-[11px] text-subtle-foreground">{t("brand.logo.generated")}</span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => updateProfile({ logoSvg: null })}>
              <RotateCcw /> {t("brand.logo.useGenerated")}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("brand.logo.fileLabel")}
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
