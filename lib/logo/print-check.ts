/**
 * One-color print check: finds the thinnest solid stroke and the thinnest gap in a rasterized
 * monochrome logo. A line thinner than the press can hold fills in on embossing, foil and small print,
 * and a gap thinner than that closes up.
 *
 * The measure is a morphological opening. Features narrower than a width disappear when the shape is
 * eroded and grown back by half that width, so the smallest width that removes a meaningful area is
 * the thinnest feature. Tapering points always get thin at the tip, so a removed area only counts
 * when it is larger than a tip could be. Everything here is plain arrays: no canvas, no dependency.
 */

/** A row-major bitmap: 1 for ink, 0 for paper. */
export type InkBitmap = { width: number; height: number; ink: Uint8Array };

/** Millimetres in a typographic point, which is what printers quote line weights in. */
export const MM_PER_POINT = 25.4 / 72;

const INFINITY = 1e20;

/** Felzenszwalb and Huttenlocher's 1D squared distance transform, in place. */
function transform1d(values: Float64Array, length: number, hull: Int32Array, bounds: Float64Array, out: Float64Array) {
  let k = 0;
  hull[0] = 0;
  bounds[0] = -INFINITY;
  bounds[1] = INFINITY;
  for (let q = 1; q < length; q += 1) {
    let intersection: number;
    for (;;) {
      const p = hull[k]!;
      intersection = (values[q]! + q * q - (values[p]! + p * p)) / (2 * q - 2 * p);
      if (intersection <= bounds[k]! && k > 0) k -= 1;
      else break;
    }
    if (intersection <= bounds[k]!) {
      hull[k] = q;
      bounds[k] = -INFINITY;
      bounds[k + 1] = INFINITY;
    } else {
      k += 1;
      hull[k] = q;
      bounds[k] = intersection;
      bounds[k + 1] = INFINITY;
    }
  }
  k = 0;
  for (let q = 0; q < length; q += 1) {
    while (bounds[k + 1]! < q) k += 1;
    const p = hull[k]!;
    out[q] = (q - p) * (q - p) + values[p]!;
  }
}

/**
 * For every pixel set in `mask`, the distance in pixels to the nearest pixel that is not set (zero for
 * pixels that are not set). An image edge is not a boundary: pad the mask if one should count.
 */
export function distanceToUnset(mask: Uint8Array, width: number, height: number): Float32Array {
  const size = Math.max(width, height);
  const column = new Float64Array(size);
  const result = new Float64Array(size);
  const hull = new Int32Array(size);
  const bounds = new Float64Array(size + 1);
  const grid = new Float64Array(width * height);
  for (let i = 0; i < grid.length; i += 1) grid[i] = mask[i] ? INFINITY : 0;

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) column[y] = grid[y * width + x]!;
    transform1d(column, height, hull, bounds, result);
    for (let y = 0; y < height; y += 1) grid[y * width + x] = result[y]!;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) column[x] = grid[y * width + x]!;
    transform1d(column, width, hull, bounds, result);
    for (let x = 0; x < width; x += 1) grid[y * width + x] = result[x]!;
  }
  const distances = new Float32Array(width * height);
  for (let i = 0; i < distances.length; i += 1)
    distances[i] = grid[i]! >= INFINITY / 2 ? INFINITY : Math.sqrt(grid[i]!);
  return distances;
}

function count(mask: Uint8Array): number {
  let total = 0;
  for (let i = 0; i < mask.length; i += 1) total += mask[i]!;
  return total;
}

/** Surrounds a bitmap with `margin` pixels of the given value, so its edges are not treated as shape. */
function pad(mask: Uint8Array, width: number, height: number, margin: number, fill: 0 | 1) {
  const w = width + margin * 2;
  const h = height + margin * 2;
  const out = new Uint8Array(w * h).fill(fill);
  for (let y = 0; y < height; y += 1) out.set(mask.subarray(y * width, (y + 1) * width), (y + margin) * w + margin);
  return { mask: out, width: w, height: h };
}

/**
 * The pixels of `mask` in a feature narrower than `feature` pixels: the shape minus its opening by a
 * disc of that width. A band `n` pixels across has a centre pixel `(n + 1) / 2` from the nearest
 * unset pixel, so it survives a feature width of `n` and no more.
 */
function narrowerThan(mask: Uint8Array, width: number, height: number, feature: number): Uint8Array {
  const radius = (feature + 1) / 2;
  const toUnset = distanceToUnset(mask, width, height);
  const outside = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i += 1) outside[i] = toUnset[i]! >= radius ? 0 : 1;
  // Pixels farther than the radius from every eroded core are not covered when it grows back.
  const toCore = distanceToUnset(outside, width, height);
  const thin = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i += 1) thin[i] = mask[i] && toCore[i]! >= radius ? 1 : 0;
  return thin;
}

/** The pixel count of the largest 4-connected region in a mask. */
function largestRegion(mask: Uint8Array, width: number, height: number): number {
  const seen = new Uint8Array(mask.length);
  const stack = new Int32Array(mask.length);
  let largest = 0;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue;
    let top = 0;
    let size = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top > 0) {
      const at = stack[--top]!;
      size += 1;
      const x = at % width;
      const y = (at - x) / width;
      const next = [
        x > 0 ? at - 1 : -1,
        x < width - 1 ? at + 1 : -1,
        y > 0 ? at - width : -1,
        y < height - 1 ? at + width : -1,
      ];
      for (const to of next) {
        if (to >= 0 && mask[to] && !seen[to]) {
          seen[to] = 1;
          stack[top++] = to;
        }
      }
    }
    largest = Math.max(largest, size);
  }
  return largest;
}

/**
 * The narrowest feature of a shape in pixels, as the smallest width whose opening removes one
 * connected region larger than a tapering tip could (twice the width squared, and never more than a
 * quarter of the shape). Corners and points are many small regions, a thin line is one long one. Returns
 * `Infinity` when nothing is narrower than `limit` pixels, or when there is no shape at all.
 */
export function thinnestFeature(mask: Uint8Array, width: number, height: number, limit: number): number {
  const area = count(mask);
  if (area === 0) return Infinity;
  // The test is not monotonic (a wide opening can remove less than a thin one needs), so scan up from
  // one pixel. The limit is a few pixels in practice, so this is a handful of passes.
  for (let feature = 2; feature <= Math.max(2, Math.floor(limit) + 1); feature += 1) {
    const thin = narrowerThan(mask, width, height, feature);
    if (largestRegion(thin, width, height) >= Math.min(2 * feature * feature, area / 4)) return feature - 1;
  }
  return Infinity;
}

export type PrintCheckResult = {
  /** Thinnest solid stroke in pixels, or `Infinity` when none is thinner than the search limit. */
  stroke: number;
  /** Thinnest gap between solid parts in pixels, or `Infinity` when none is thinner than the limit. */
  gap: number;
};

/**
 * Measures a monochrome logo. `limit` is how far to search, in pixels: anything wider is reported as
 * `Infinity`, so a caller passes a few times its minimum and compares.
 */
export function measurePrintCheck(bitmap: InkBitmap, limit: number): PrintCheckResult {
  const margin = Math.ceil(limit) + 2;
  const ink = pad(bitmap.ink, bitmap.width, bitmap.height, 1, 0);
  const paper = new Uint8Array(bitmap.ink.length);
  for (let i = 0; i < paper.length; i += 1) paper[i] = bitmap.ink[i] ? 0 : 1;
  const gaps = pad(paper, bitmap.width, bitmap.height, margin, 1);
  return {
    stroke: thinnestFeature(ink.mask, ink.width, ink.height, limit),
    gap: thinnestFeature(gaps.mask, gaps.width, gaps.height, limit),
  };
}

export type PrintCheckVerdict = {
  pass: boolean;
  /** Thinnest stroke in millimetres, or null when none is thinner than the search limit. */
  strokeMm: number | null;
  gapMm: number | null;
  /** Plain words for the result. */
  summary: string;
};

export const mmText = (mm: number) => `${mm < 0.1 ? mm.toFixed(3) : mm.toFixed(2)} mm`;
export const ptText = (mm: number) => `${(mm / MM_PER_POINT).toFixed(2)} pt`;

/**
 * Turns pixel measurements into a verdict. `pixelsPerMm` is the raster's scale at the chosen print
 * width, and `minimumMm` the thinnest line the press holds.
 */
export function printCheckVerdict(result: PrintCheckResult, pixelsPerMm: number, minimumMm: number): PrintCheckVerdict {
  const toMm = (pixels: number) => (Number.isFinite(pixels) ? pixels / pixelsPerMm : null);
  const strokeMm = toMm(result.stroke);
  const gapMm = toMm(result.gap);
  const thin = (value: number | null) => value !== null && value < minimumMm;
  const problems: string[] = [];
  if (thin(strokeMm)) {
    problems.push(
      `The thinnest stroke is ${mmText(strokeMm!)} (${ptText(strokeMm!)}), under the ${ptText(minimumMm)} minimum, and may fill in.`,
    );
  }
  if (thin(gapMm)) {
    problems.push(
      `The thinnest gap is ${mmText(gapMm!)} (${ptText(gapMm!)}), under the ${ptText(minimumMm)} minimum, and may close up.`,
    );
  }
  if (problems.length) return { pass: false, strokeMm, gapMm, summary: problems.join(" ") };
  const found = [
    strokeMm !== null ? `the thinnest stroke is ${mmText(strokeMm)}` : null,
    gapMm !== null ? `the thinnest gap is ${mmText(gapMm)}` : null,
  ].filter(Boolean);
  return {
    pass: true,
    strokeMm,
    gapMm,
    summary: `Every stroke and gap holds the ${ptText(minimumMm)} minimum${found.length ? `: ${found.join(" and ")}` : ""}.`,
  };
}

/** Raster width in pixels for a print width: enough to resolve the minimum line at 2 px, within limits. */
export function printCheckRasterWidth(printWidthMm: number, minimumMm: number): number {
  return Math.min(1600, Math.max(200, Math.round((printWidthMm * 2) / minimumMm)));
}

/** Turns canvas pixels (RGBA) into a bitmap: a pixel is ink when it is mostly opaque. */
export function inkFromRgba(data: ArrayLike<number>, width: number, height: number): InkBitmap {
  const ink = new Uint8Array(width * height);
  for (let i = 0; i < ink.length; i += 1) ink[i] = data[i * 4 + 3]! >= 128 ? 1 : 0;
  return { width, height, ink };
}
