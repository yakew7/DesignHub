"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useA11yStore } from "@/store/a11y-store";

const a11yFonts = ["Inter", "Atkinson Hyperlegible Next", "Lexend", "Source Serif 4", "Merriweather"];

export function A11yTypePanel() {
  const { t } = useI18n();
  const typography = useA11yStore((state) => state.typography);
  const setTypography = useA11yStore((state) => state.setTypography);
  const sample = useA11yStore((state) => state.sample);
  const setSample = useA11yStore((state) => state.setSample);

  return (
    <Panel title={t("a11y.type.sample")}>
      <div className="flex flex-col gap-2">
        <Label>{t("a11y.type.typeface")}</Label>
        <Select value={typography.family} onValueChange={(family) => setTypography({ family })}>
          <SelectTrigger aria-label={t("a11y.type.typeface")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {a11yFonts.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="a11y-sample">{t("a11y.colors.text")}</Label>
        <Textarea
          id="a11y-sample"
          value={sample}
          onChange={(event) => setSample(event.target.value)}
          className="min-h-28"
        />
      </div>
    </Panel>
  );
}
