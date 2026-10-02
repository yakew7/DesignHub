"use client";

import { useMemo } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useVariantContext } from "@/hooks/use-variant-context";
import { invertedLockup, logoVariants, renderVariant } from "@/lib/logo/variants";
import { cn } from "@/lib/utils";
import { useLogoStore } from "@/store/logo-store";

const MIN_SIZES = [16, 24, 32, 48, 64];

export function LogoVariants() {
  const ctx = useVariantContext();
  const selected = useLogoStore((state) => state.variant);
  const setVariant = useLogoStore((state) => state.setVariant);
  const rendered = useMemo(() => logoVariants.map((variant) => ({ variant, svg: variant.render(ctx) })), [ctx]);
  const horizontal = useMemo(() => renderVariant("horizontal", ctx), [ctx]);
  const mark = useMemo(() => renderVariant("color", ctx), [ctx]);
  const inverted = useMemo(() => invertedLockup(ctx), [ctx]);

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Logo variants">
        {rendered.map(({ variant, svg }) => (
          <li key={variant.id}>
            <button
              type="button"
              onClick={() => setVariant(variant.id)}
              aria-pressed={selected === variant.id}
              className={cn(
                "flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors duration-150 hover:border-border-strong",
                selected === variant.id && "border-brand/60",
              )}
            >
              <span
                className={cn(
                  "flex h-32 items-center justify-center p-5",
                  variant.background(ctx) === "transparent" && "bg-checker",
                )}
                style={variant.background(ctx) === "transparent" ? undefined : { background: variant.background(ctx) }}
              >
                <BrandLogo svg={svg} className="max-h-full max-w-full" />
              </span>
              <span className="flex flex-col gap-0.5 border-t bg-card p-3">
                <span className="text-sm font-medium">{variant.label}</span>
                <span className="text-xs text-muted-foreground">{variant.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <section aria-label="Minimum size" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Minimum size</h3>
        <div className="flex flex-wrap items-end gap-5 rounded-lg border p-4" style={{ background: ctx.light }}>
          {MIN_SIZES.map((size) => (
            <figure key={size} className="flex flex-col items-center gap-1.5">
              <span className="flex items-end" style={{ width: size, height: size }}>
                <BrandLogo svg={mark} className="size-full" />
              </span>
              <figcaption className="font-mono text-[10px]" style={{ color: ctx.text }}>
                {size}px
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Keep the mark at 24px or larger on screen, and the horizontal lockup at 96px wide or larger. Below that, use
          the mark alone.
        </p>
      </section>

      <section aria-label="Backgrounds" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">On different backgrounds</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[ctx.light, ctx.dark, ctx.primary, "linear-gradient(135deg,#1e1b4b,#6366f1 60%,#f472b6)"].map(
            (background, index) => (
              <div
                key={index}
                className="flex h-24 items-center justify-center rounded-md border p-4"
                style={{ background }}
              >
                <BrandLogo svg={index === 0 ? horizontal : inverted} className="max-h-full max-w-full" />
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
