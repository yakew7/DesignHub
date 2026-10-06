import {
  ColorSpace,
  HSL,
  OKLCH,
  OKLab,
  P3,
  XYZ_D65,
  contrastAPCA,
  contrastWCAG21,
  deltaEOK,
  getColor,
  inGamut,
  sRGB,
  sRGB_Linear,
  to,
  toGamut,
  type PlainColorObject,
} from "colorjs.io/fn";

/*
 * Color.js' tree-shakable API. Only the spaces DesignHub needs are registered,
 * which keeps the Color Studio bundle far smaller than the all-in-one build.
 */
[XYZ_D65, sRGB_Linear, sRGB, HSL, P3, OKLab, OKLCH].forEach((space) => ColorSpace.register(space));

export type ColorObject = PlainColorObject;
export { contrastAPCA, contrastWCAG21, deltaEOK, getColor, inGamut, to, toGamut, OKLCH, OKLab, sRGB, sRGB_Linear };
