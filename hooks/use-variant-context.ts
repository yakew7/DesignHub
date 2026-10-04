"use client";

import { useEffect, useMemo, useState } from "react";

import { useBrandTokens } from "@/hooks/use-brand";
import { useBrandFonts } from "@/hooks/use-brand-fonts";
import { useEmbeddedFont } from "@/hooks/use-embedded-font";
import { measureText } from "@/lib/logo/measure";
import { variantContext, type VariantContext } from "@/lib/logo/variants";

/** Everything a logo variant needs, derived from the live brand. */
export function useVariantContext(): VariantContext {
  const brand = useBrandTokens();
  useBrandFonts(brand);
  const { heading, headingWeight } = brand.typography;
  const fontCss = useEmbeddedFont(heading, headingWeight, brand.name);
  // Text is measured in the real font, so re-measure once it has loaded.
  const [fontsReady, setFontsReady] = useState(0);
  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => active && setFontsReady((value) => value + 1));
    return () => {
      active = false;
    };
  }, [heading, fontCss]);

  return useMemo(
    () => variantContext(brand, fontCss, (text, size) => measureText(text, heading, headingWeight, size)),
    // fontsReady is a dependency on purpose: it re-runs measurement after web fonts load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brand, heading, headingWeight, fontCss, fontsReady],
  );
}
