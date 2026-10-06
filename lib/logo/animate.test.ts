import { describe, expect, test } from "vitest";

import { generateLogoMark } from "@/lib/brand/logo";
import { drawOnSvg } from "@/lib/logo/animate";
import { logoVariants, renderVariant, type VariantContext } from "@/lib/logo/variants";
import { parseSvg } from "@/lib/svg/parse";
import { minify } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

const ctx = (logo: string): VariantContext => ({
  logo,
  name: "Acme",
  fontFamily: "Inter",
  fontWeight: 700,
  fontCss: "",
  measure: (text, size) => text.length * size * 0.6,
  primary: "#4f46e5",
  text: "#111111",
  light: "#ffffff",
  dark: "#000000",
});

/** The markup a renderer without CSS sees: no <style>, and no class or style attributes. */
function staticFrame(svg: string): string {
  const parsed = parseSvg(svg);
  if (!parsed.ok) throw new Error(parsed.error);
  const strip = (node: SvgNode): SvgNode => ({
    ...node,
    attributes: Object.fromEntries(
      Object.entries(node.attributes).filter(([name]) => name !== "class" && name !== "style"),
    ),
    children: node.children.filter((child) => child.name !== "style").map(strip),
  });
  return minify(strip(parsed.root));
}

const uploaded =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="alert(1)"><script>alert(1)</script>' +
  '<g fill="#e11d48"><circle cx="50" cy="50" r="40"/></g>' +
  '<path d="M10 90 L90 90" stroke="#0f172a" stroke-width="4" fill="none"/>' +
  '<text x="10" y="20">Hi</text></svg>';

describe("drawOnSvg", () => {
  test("the static frame is the finished logo", () => {
    for (const name of ["Acme", "Globex", "Initech", "Umbrella"]) {
      const mark = generateLogoMark(name, "#4f46e5", "#f59e0b");
      const animated = drawOnSvg(mark);
      expect(animated).not.toBeNull();
      expect(staticFrame(animated!)).toBe(staticFrame(mark));
    }
  });

  test("measures each outline for stroke-dasharray", () => {
    const animated = drawOnSvg(uploaded)!;
    // The circle (r 40) and the 80 long line, padded by 2% plus one unit.
    expect(animated).toContain(`--dh-l:${Math.round((2 * Math.PI * 40 * 1.02 + 1) * 100) / 100}`);
    expect(animated).toContain(`--dh-l:${80 * 1.02 + 1}`);
    expect(animated).toContain("stroke-dasharray:var(--dh-l)");
  });

  test("filled shapes trace in their inherited fill, stroked ones draw their own stroke", () => {
    const animated = drawOnSvg(uploaded)!;
    expect(animated).toMatch(/<circle[^>]*--dh-c:#e11d48[^>]*class="dh-trace"/);
    expect(animated).toMatch(/<path[^>]*class="dh-draw"/);
    expect(animated).toMatch(/<text[^>]*class="dh-fade"/);
  });

  test("uploaded logos stay sanitized", () => {
    const animated = drawOnSvg(uploaded)!;
    expect(animated).not.toContain("<script");
    expect(animated).not.toContain("onload");
  });

  test("plays once by default and loops on request", () => {
    expect(drawOnSvg(uploaded)).toContain("animation-iteration-count:1");
    expect(drawOnSvg(uploaded, { loop: true })).toContain("animation-iteration-count:infinite");
  });

  test("reduced motion turns the animation off", () => {
    expect(drawOnSvg(uploaded)).toContain(
      "@media (prefers-reduced-motion:reduce){.dh-draw,.dh-trace,.dh-fade{animation:none}}",
    );
  });

  test("works on every rendered variant and stays valid SVG", () => {
    const logo = generateLogoMark("Acme", "#4f46e5", "#f59e0b");
    for (const variant of logoVariants) {
      const source = renderVariant(variant.id, ctx(logo));
      const animated = drawOnSvg(source);
      expect(animated, variant.id).not.toBeNull();
      expect(parseSvg(animated!).ok, variant.id).toBe(true);
      expect(staticFrame(animated!), variant.id).toBe(staticFrame(source));
    }
  });

  test("returns null for input that is not SVG", () => {
    expect(drawOnSvg("<div/>")).toBeNull();
  });
});
