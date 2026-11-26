"use client";

import { A11yPreview } from "@/components/accessibility/a11y-preview";
import { visionFilter } from "@/components/accessibility/vision-filters";
import { useI18n } from "@/components/layout/locale-provider";
import { visionModes } from "@/lib/a11y/vision";
import { useA11yStore } from "@/store/a11y-store";

/** The sample UI through the selected lens, or every lens at once. */
export function VisionPreview({ compare }: { compare: boolean }) {
  const { t } = useI18n();
  const vision = useA11yStore((state) => state.vision);

  if (compare) {
    return (
      <ul className="grid gap-3 xl:grid-cols-2" aria-label={t("a11y.vision.all")}>
        {visionModes.map((mode) => (
          <li key={mode.value} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{mode.label}</span>
            <A11yPreview compact style={{ filter: visionFilter(mode.value) }} />
          </li>
        ))}
      </ul>
    );
  }

  const label = visionModes.find((mode) => mode.value === vision)?.label;
  return (
    <div className="flex flex-col gap-2">
      {vision !== "none" ? <p className="text-xs font-medium text-muted-foreground">Simulating: {label}</p> : null}
      <A11yPreview style={{ filter: visionFilter(vision) }} />
    </div>
  );
}
