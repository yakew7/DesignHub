"use client";

import { Download, FileArchive, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AssetCard } from "@/components/export/asset-card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useBrandTokens } from "@/hooks/use-brand";
import { useGuidelineBase } from "@/hooks/use-guideline-context";
import { useSocialContext } from "@/hooks/use-social-context";
import { useVariantContext } from "@/hooks/use-variant-context";
import { brandJson } from "@/lib/brand/json";
import { downloadBlob, downloadText } from "@/lib/download";
import { svgToDataUrl } from "@/lib/icons/svg";
import { slugify } from "@/lib/logo/pack";
import { useBrandStore } from "@/store/brand-store";
import { useGuidelinesStore } from "@/store/guidelines-store";
import { useLogoStore } from "@/store/logo-store";
import { useSocialStore } from "@/store/social-store";

type Job = "book" | "logo" | "social";

const pdfBlob = (bytes: Uint8Array, type: string) => new Blob([bytes.slice().buffer], { type });

/** Brand-level files: the brand JSON, the brand book, and the logo and social packs. */
export function BrandAssetExports() {
  const brand = useBrandTokens();
  const voice = useBrandStore((state) => state.profile.voice);
  const mission = useBrandStore((state) => state.profile.mission);
  const guidelineBase = useGuidelineBase();
  const excluded = useGuidelinesStore((state) => state.excluded);
  const variantCtx = useVariantContext();
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const socialCtx = useSocialContext();
  const packSelection = useSocialStore((state) => state.packSelection);
  const [job, setJob] = useState<{ id: Job; progress: number } | null>(null);
  const json = useMemo(() => brandJson(brand, voice, mission), [brand, voice, mission]);
  const base = slugify(brand.name);

  // Heavy builders load on demand, so the Export Engine stays fast to open.
  async function run(id: Job) {
    setJob({ id, progress: 0 });
    const progress = (done: number, total: number) => setJob({ id, progress: Math.round((done / total) * 100) });
    try {
      if (id === "book") {
        const { buildBrandBookFrom } = await import("@/lib/guidelines/book");
        const pdf = await buildBrandBookFrom(guidelineBase, excluded, progress);
        downloadBlob(pdfBlob(pdf, "application/pdf"), `${base}-brand-guidelines.pdf`);
      }
      if (id === "logo") {
        const { buildLogoPack } = await import("@/lib/logo/pack");
        const zip = await buildLogoPack(variantCtx, clearSpace);
        downloadBlob(pdfBlob(zip, "application/zip"), `${base}-logo-pack.zip`);
      }
      if (id === "social") {
        const { buildSocialPack } = await import("@/lib/social/pack");
        const zip = await buildSocialPack(socialCtx, progress, packSelection);
        downloadBlob(pdfBlob(zip, "application/zip"), `${base}-social.zip`);
      }
      toast.success("Download ready");
    } catch {
      toast.error("Export failed in this browser.");
    } finally {
      setJob(null);
    }
  }

  const busy = (id: Job) =>
    job?.id === id ? (
      <>
        <Loader2 className="animate-spin" /> {job.progress ? `${job.progress}%` : "Working"}
      </>
    ) : null;

  return (
    <section aria-labelledby="brand-assets-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="brand-assets-title" className="text-lg font-medium">
          Brand assets
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything generated from {brand.name}: data, documentation and ready-to-post files.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AssetCard
          title="Brand JSON"
          description="Name, logo, colors with roles, type, radius, spacing, shadow, voice and mission in one file."
          preview={
            <div className="flex size-full items-center justify-center gap-3 bg-surface-raised">
              {/* eslint-disable-next-line @next/next/no-img-element -- sanitized SVG data URL */}
              <img src={svgToDataUrl(brand.logo.svg)} alt="" className="size-10 object-contain" />
              <span className="flex h-6 overflow-hidden rounded">
                {brand.colors.all.map((color) => (
                  <span key={color.id} className="w-4" style={{ background: color.hex }} />
                ))}
              </span>
            </div>
          }
          actions={
            <>
              <CopyButton value={json} variant="outline" size="sm" toastMessage="Brand JSON copied">
                Copy
              </CopyButton>
              <Button variant="outline" size="sm" onClick={() => downloadText(json, `${base}.brand.json`)}>
                <Download /> brand.json
              </Button>
            </>
          }
        />
        <AssetCard
          title="Brand guidelines"
          description="The full brand book as a PDF, from cover to token appendix."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => run("book")} disabled={job !== null}>
                {busy("book") ?? (
                  <>
                    <FileText /> PDF
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/guidelines">Edit</Link>
              </Button>
            </>
          }
        />
        <AssetCard
          title="Logo pack"
          description="Seven variants as SVG, PNG and PDF, with usage notes."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => run("logo")} disabled={job !== null}>
                {busy("logo") ?? (
                  <>
                    <FileArchive /> ZIP
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/logo">Edit</Link>
              </Button>
            </>
          }
        />
        <AssetCard
          title="Social assets"
          description="Banners, covers, posts, OG images and thumbnails at platform sizes."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => run("social")}
                disabled={job !== null || packSelection?.length === 0}
              >
                {busy("social") ?? (
                  <>
                    <FileArchive /> ZIP
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/social">Edit</Link>
              </Button>
            </>
          }
        />
      </ul>
    </section>
  );
}
