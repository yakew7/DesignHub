"use client";

import { useEffect, useMemo, useState } from "react";

import { useDesignTokens } from "@/hooks/use-design-tokens";
import { useDrawContext } from "@/hooks/use-draw-context";
import { guidelinePages } from "@/lib/guidelines/registry";
import type { GuidelineBase, GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { useVariantContext } from "@/hooks/use-variant-context";
import { useBrandStore } from "@/store/brand-store";
import { useGuidelinesStore } from "@/store/guidelines-store";
import { useLogoStore } from "@/store/logo-store";

/** Everything the guideline pages read, without the page list (so it doesn't pull in every page). */
export function useGuidelineBase(): GuidelineBase {
  const mode = useGuidelinesStore((state) => state.mode);
  const coverStyle = useGuidelinesStore((state) => state.coverStyle);
  const voice = useBrandStore((state) => state.profile.voice);
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const draw = useDrawContext(mode);
  const logo = useVariantContext();
  const tokens = useDesignTokens();
  // Set after mount so server and client render the same markup.
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }));
  }, []);
  return useMemo(
    () => ({ ...draw, voice, tokens, logo, clearSpace, coverStyle, date }),
    [draw, voice, tokens, logo, clearSpace, coverStyle, date],
  );
}

export function withContents(base: GuidelineBase, pages: GuidelinePage[]): GuidelineContext {
  return { ...base, contents: pages.map((page, i) => ({ id: page.id, title: page.title, number: i + 1 })) };
}

export function useGuidelineContext(): { ctx: GuidelineContext; pages: GuidelinePage[] } {
  const base = useGuidelineBase();
  const excluded = useGuidelinesStore((state) => state.excluded);
  return useMemo(() => {
    const pages = guidelinePages.filter((page) => !excluded.includes(page.id));
    return { ctx: withContents(base, pages), pages };
  }, [base, excluded]);
}
