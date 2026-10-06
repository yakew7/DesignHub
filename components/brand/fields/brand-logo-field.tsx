"use client";

import { RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBrandTokens } from "@/hooks/use-brand";
import { svgToDataUrl } from "@/lib/icons/svg";
import { readSvgFile } from "@/lib/svg/read-file";
import { useBrandStore } from "@/store/brand-store";

export function BrandLogoField() {
  const brand = useBrandTokens();
  const updateProfile = useBrandStore((state) => state.updateProfile);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      // The sanitizer (an SVG parser and optimizer) loads with the first upload.
      const [source, { sanitizeSvg }] = await Promise.all([readSvgFile(file), import("@/lib/svg/sanitize")]);
      const clean = sanitizeSvg(source);
      if (!clean) throw new Error("That file isn't a valid SVG.");
      updateProfile({ logoSvg: clean });
      toast.success("Logo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Logo</Label>
      <div className="flex flex-wrap items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
        <img
          src={svgToDataUrl(brand.logo.svg)}
          alt="Current logo"
          className="bg-checker size-14 shrink-0 rounded-md border object-contain p-1.5"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload /> Upload SVG
          </Button>
          {brand.logo.generated ? (
            <span className="text-[11px] text-subtle-foreground">Generated from the brand name</span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => updateProfile({ logoSvg: null })}>
              <RotateCcw /> Use generated mark
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
        aria-label="Logo SVG file"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
