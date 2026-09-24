"use client";

import { useMemo } from "react";

import { useDrawContext } from "@/hooks/use-draw-context";
import { brandSurface } from "@/lib/brand/theme";
import { resolveSocialContent } from "@/lib/social/content";
import type { SocialContext } from "@/lib/social/types";
import { useSocialStore } from "@/store/social-store";

/**
 * The brand, with this studio's content and design overrides applied on top. Every social
 * template renders from this one context, so an edit here updates all of them.
 */
export function useSocialContext(): SocialContext {
  const mode = useSocialStore((state) => state.mode);
  const content = useSocialStore((state) => state.content);
  const design = useSocialStore((state) => state.design);
  const draw = useDrawContext(mode);

  return useMemo(() => {
    const resolved = resolveSocialContent(content, draw.brand);
    const { colors } = draw.brand;
    const brand = {
      ...draw.brand,
      name: resolved.name,
      logo: design.logoSvg ? { svg: design.logoSvg, generated: false } : draw.brand.logo,
      radius: design.radius ?? draw.brand.radius,
      colors: {
        ...colors,
        primary: design.primary ? [design.primary, ...colors.primary] : colors.primary,
        secondary: design.secondary ? [design.secondary, ...colors.secondary] : colors.secondary,
      },
    };
    return {
      ...draw,
      brand,
      surface: brandSurface(brand, mode),
      content: resolved,
      layout: { padding: design.padding, background: design.background },
    };
  }, [draw, content, design, mode]);
}
