import { expect, test } from "vitest";

import {
  AVATAR_CLEAR_SPACE,
  avatarMarkSize,
  logoVariants,
  renderVariant,
  type VariantContext,
} from "@/lib/logo/variants";

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

test.each([0.25, 1, 2, 4])("the avatar mark and its clear space fit in the circle (aspect %f)", (aspect) => {
  const size = 512;
  const { width, height } = avatarMarkSize(aspect, size);
  expect(width / height).toBeCloseTo(aspect);
  const pad = height * AVATAR_CLEAR_SPACE;
  // The corners of the clear-space box touch the circle, so its diagonal equals the diameter.
  expect(Math.hypot(width + pad * 2, height + pad * 2)).toBeCloseTo(size);
});

test("the avatar is a 512 px circle on the primary color with the mark centred", () => {
  const svg = renderVariant(
    "avatar",
    ctx(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" fill="red"/></svg>`,
    ),
  );
  expect(svg).toContain('width="512" height="512"');
  expect(svg).toContain('<circle cx="256" cy="256" r="256" fill="#4f46e5"/>');
  const { width, height } = avatarMarkSize(2, 512);
  expect(svg).toContain(`x="${(512 - width) / 2}"`);
  expect(svg).toContain(`y="${(512 - height) / 2}"`);
  expect(svg).not.toContain("red");
});

test("the avatar exports at 400 and 1024 px in the logo pack", () => {
  expect(logoVariants.find((variant) => variant.id === "avatar")?.pngSizes).toEqual([400, 1024]);
});
