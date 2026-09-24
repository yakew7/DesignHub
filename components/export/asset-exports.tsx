"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { AssetCard } from "@/components/export/asset-card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { backgroundCss } from "@/lib/background/export";
import { renderBackgroundSvg } from "@/lib/background/registry";
import { downloadText } from "@/lib/download";
import { withSvgCredit } from "@/lib/export/credit";
import { effectsBundle } from "@/lib/effects/bundle";
import { svgToDataUrl } from "@/lib/icons/svg";
import { useBackgroundStore } from "@/store/background-store";
import { useA11yReport } from "@/hooks/use-a11y-report";
import { useOptimizedSvg } from "@/hooks/use-optimized-svg";
import { stampReport } from "@/lib/a11y/report";
import { formatBytes } from "@/lib/svg-size";
import { useEffectsStore } from "@/store/effects-store";
import { useSvgStore } from "@/store/svg-store";

/** Files from the other studios that don't fit the token model: backgrounds, effects… */
export function AssetExports() {
  const background = useBackgroundStore((state) => state.settings);
  const effects = useEffectsStore((state) => state.settings);

  const backgroundSvg = useMemo(() => renderBackgroundSvg(background), [background]);
  const backgroundStyles = useMemo(() => backgroundCss(background), [background]);
  const effectsCss = useMemo(() => effectsBundle(effects), [effects]);
  const svgName = useSvgStore((state) => state.name);
  const optimized = useOptimizedSvg();
  const a11y = useA11yReport();
  const contrastChecks = (a11y.sections.contrast as { pass: boolean }[] | undefined) ?? [];
  const passing = contrastChecks.filter((check) => check.pass).length;

  return (
    <section aria-labelledby="assets-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="assets-title" className="text-lg font-medium">
          Assets
        </h2>
        <p className="text-sm text-muted-foreground">Ready-made files from the other studios, always in sync.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AssetCard
          title="Background"
          description={`${background.kind} · seed ${background.seed} · ${background.width}×${background.height}`}
          preview={
            // eslint-disable-next-line @next/next/no-img-element -- generated SVG data URL
            <img src={svgToDataUrl(backgroundSvg)} alt="" className="size-full object-cover" />
          }
          actions={
            <>
              <CopyButton value={backgroundStyles} variant="outline" size="sm" toastMessage="Background CSS copied">
                CSS
              </CopyButton>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadText(withSvgCredit(backgroundSvg), `background-${background.kind}.svg`)}
              >
                <Download /> SVG
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/backgrounds">Edit</Link>
              </Button>
            </>
          }
        />
        <AssetCard
          title="Effects"
          description="Glass, neumorphism, shadow, glow, border and grain as .fx-* classes."
          actions={
            <>
              <CopyButton value={effectsCss} variant="outline" size="sm" toastMessage="Effects CSS copied">
                CSS
              </CopyButton>
              <Button variant="outline" size="sm" onClick={() => downloadText(effectsCss, "effects.css")}>
                <Download /> effects.css
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/effects">Edit</Link>
              </Button>
            </>
          }
        />
        {optimized ? (
          <AssetCard
            title="Optimized SVG"
            description={`${svgName} · ${formatBytes(optimized.before)} → ${formatBytes(optimized.after)} (−${Math.round(optimized.saved * 100)}%)`}
            preview={
              // eslint-disable-next-line @next/next/no-img-element -- optimized SVG data URL (scripts already stripped)
              <img src={svgToDataUrl(optimized.svg)} alt="" className="bg-checker size-full object-contain p-2" />
            }
            actions={
              <>
                <CopyButton value={optimized.svg} variant="outline" size="sm" toastMessage="SVG copied">
                  SVG
                </CopyButton>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(optimized.svg, svgName.replace(/\.svg$/i, ".min.svg"))}
                >
                  <Download /> .svg
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/svg">Edit</Link>
                </Button>
              </>
            }
          />
        ) : null}
        <AssetCard
          title="Accessibility report"
          description={`Contrast ${passing}/${contrastChecks.length} passing, plus vision, readability and touch targets.`}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadText(stampReport(a11y), "accessibility-report.json")}
              >
                <Download /> report.json
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/accessibility">Edit</Link>
              </Button>
            </>
          }
        />
      </ul>
    </section>
  );
}
