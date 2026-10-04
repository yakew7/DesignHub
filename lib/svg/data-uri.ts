/**
 * Percent-encodes an SVG for a `data:image/svg+xml,...` URL, touching only the characters that
 * need it, so the result stays readable and shorter than base64. `%`, `#` (it would start a
 * fragment), `<`, `>`, backslashes, control characters and non-ASCII are encoded. Double quotes
 * become single quotes when the SVG has none, otherwise %22, so the URL can sit inside url("...").
 */
export function svgDataUri(svg: string): string {
  const source = svg.trim();
  const quoted = source.includes("'") ? source : source.replace(/"/g, "'");
  const encoded = quoted.replace(/[%#<>"\\{}|^`]|[^\x20-\x7e]+/g, (match) => encodeURIComponent(match));
  return `data:image/svg+xml,${encoded}`;
}

/** A CSS `url("...")` for the SVG, ready for background-image or mask. */
export function svgCssUrl(svg: string): string {
  return `url("${svgDataUri(svg)}")`;
}

/** Length of the same SVG as a base64 data URI, to show what the plain encoding saves. */
export function base64DataUriLength(svg: string): number {
  const bytes = new TextEncoder().encode(svg.trim()).length;
  return "data:image/svg+xml;base64,".length + Math.ceil(bytes / 3) * 4;
}

/** A ready-to-paste CSS rule that draws the SVG as a background image. */
export function svgBackgroundCss(svg: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const selector = `.${/^[a-z_]/.test(slug) ? slug : `svg-${slug}`}`;
  const uri = svgDataUri(svg);
  return `/* ${uri.length} characters (base64 would be ${base64DataUriLength(svg)}) */
${selector} {
  background-image: url("${uri}");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}
`;
}
