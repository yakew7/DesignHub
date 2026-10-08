import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  AccessibilityPreview,
  BackgroundPreview,
  ColorPreview,
  EffectsPreview,
  ExportPreview,
  IconPreview,
  SvgPreview,
  TypographyPreview,
} from "@/components/home/module-previews";
import { studios, type StudioId } from "@/lib/navigation";

const previews: Partial<Record<StudioId, ReactNode>> = {
  typography: <TypographyPreview />,
  colors: <ColorPreview />,
  icons: <IconPreview />,
  backgrounds: <BackgroundPreview />,
  effects: <EffectsPreview />,
  svg: <SvgPreview />,
  accessibility: <AccessibilityPreview />,
  export: <ExportPreview />,
};

const highlights: Partial<Record<StudioId, string[]>> = {
  typography: ["Google Fonts", "Pairing", "Fluid scale", "OpenType"],
  colors: ["OKLCH", "Harmonies", "Shades 50–950", "WCAG"],
  icons: ["Iconify", "Restyle", "SVG · React · PNG", "Favicons"],
  backgrounds: ["8 generators", "Seeded", "SVG · PNG · CSS", "Palette aware"],
  effects: ["Glass", "Neumorphism", "Shadows", "CSS · Tailwind"],
  svg: ["Optimize", "Inspect", "JSX · React Native", "Sprites"],
  accessibility: ["WCAG", "Color vision", "Readability", "Touch targets"],
  export: ["CSS", "SCSS", "Tailwind", "JSON tokens"],
};

function GenericPreview({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border bg-surface">
      <Icon className="size-10 text-subtle-foreground" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function ModuleCards() {
  return (
    <section aria-labelledby="modules-title" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle-foreground">
          {studios.length} studios
        </p>
        <h2 id="modules-title" className="text-3xl font-medium md:text-4xl">
          One workspace. Every design decision.
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {studios.map((studio) => {
          const Icon = studio.icon;
          return (
            <li key={studio.id}>
              <Link
                href={studio.href}
                className="group flex h-full flex-col gap-6 rounded-xl border bg-card p-6 transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-surface-raised focus-visible:border-ring"
              >
                <div className="h-36">{previews[studio.id] ?? <GenericPreview icon={Icon} />}</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="flex items-center gap-2 text-lg font-medium">
                      <Icon className="size-4 text-brand" aria-hidden />
                      {studio.title}
                    </h3>
                    <ArrowUpRight
                      className="size-4 text-subtle-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{studio.description}</p>
                  <ul className="flex flex-wrap gap-1.5 pt-2" aria-label="Highlights">
                    {(highlights[studio.id] ?? []).map((item) => (
                      <li key={item} className="rounded-sm border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
