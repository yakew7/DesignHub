import { CREDIT_TEXT } from "@/lib/export/credit";
import { PAGE_HEIGHT, PAGE_WIDTH, type GuidelineContext, type GuidelinePage } from "@/lib/guidelines/types";
import { slugify } from "@/lib/logo/pack";
import { logoVariants } from "@/lib/logo/variants";
import { tokenFormats } from "@/lib/tokens/formats";
import { createZip, type ZipEntry } from "@/lib/zip";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const unescapeXml = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

type Block = { tag: "h1" | "h2" | "p"; text: string };

type SvgText = { font: string; x: number; y: number; size: number; spaced: boolean; value: string };

/**
 * The text of a rendered guideline page as headings and paragraphs, in drawing order, so the
 * site has real, searchable HTML next to the page art. Wrapped lines join back into one
 * paragraph, and items on one baseline (a contents number and its title) or an item number
 * and its label into one line.
 */
export function pageBlocks(svg: string): Block[] {
  const texts: SvgText[] = [];
  for (const match of svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
    const attrs = match[1] ?? "";
    const attr = (name: string) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
    const font = attr("class");
    // Only text drawn with the page kit; logo artwork can carry its own <text>.
    if (font !== "h" && font !== "b" && font !== "bb") continue;
    const value = unescapeXml(match[2] ?? "").trim();
    if (!value) continue;
    texts.push({
      font,
      x: Number(attr("x")),
      y: Number(attr("y")),
      size: Number(attr("font-size")),
      spaced: attr("letter-spacing") !== undefined,
      value,
    });
  }
  // The running header (section and page number) and footer repeat the site navigation.
  const body = texts.filter((item) => item.y !== 71 && item.y !== PAGE_HEIGHT - 40);
  const standardTitle = body.find((item) => item.font === "h" && item.size === 52 && item.y === 150);
  const title = standardTitle ?? body.reduce<SvgText | undefined>((a, b) => (a && a.size >= b.size ? a : b), undefined);

  const blocks: Block[] = [];
  let last: SvgText | undefined;
  for (const item of body) {
    if (item === title) {
      blocks.push({ tag: "h1", text: item.value });
      last = undefined;
      continue;
    }
    if (item.font === "bb" && item.spaced) {
      blocks.push({ tag: "h2", text: item.value });
      last = undefined;
      continue;
    }
    const previous = blocks[blocks.length - 1];
    // Close together on one baseline; far apart (a footer's left and right) stays two paragraphs.
    const sameLine = last && Math.abs(item.y - last.y) < 1 && Math.abs(item.x - last.x) < 200;
    const nextLine =
      last &&
      item.x === last.x &&
      item.size === last.size &&
      item.font === last.font &&
      Math.abs(item.y - last.y - item.size * 1.5) < 1;
    // A lone item number ("01") reads as part of the item it numbers.
    const number = previous?.tag === "p" && /^\d{2}$/.test(previous.text);
    if (previous?.tag === "p" && (sameLine || nextLine || number)) previous.text += ` ${item.value}`;
    else blocks.push({ tag: "p", text: item.value });
    last = item;
  }
  return blocks;
}

/** Link and text colors stay on the page background, where primaryText is guaranteed 4.5:1. */
function stylesheet(ctx: GuidelineContext): string {
  const { surface, brand } = ctx;
  const family = (name: string, category: string) =>
    `'${name}', ${category === "serif" ? "Georgia, serif" : category === "monospace" ? "ui-monospace, monospace" : "ui-sans-serif, system-ui, sans-serif"}`;
  return `${ctx.fontCss}
:root {
  --bg: ${surface.background};
  --text: ${surface.text};
  --border: ${surface.border};
  --link: ${surface.primaryText};
  --primary: ${surface.primary};
  --radius: ${Math.min(brand.radius, 16)}px;
  color-scheme: ${ctx.mode};
}
* { box-sizing: border-box; }
html { background: var(--bg); color: var(--text); }
body { margin: 0; font: 400 16px/1.6 ${family(brand.typography.body, brand.typography.bodyCategory)}; }
h1, h2, .brand { font-family: ${family(brand.typography.heading, brand.typography.headingCategory)}; font-weight: ${brand.typography.headingWeight}; line-height: 1.2; }
h1 { font-size: clamp(2rem, 4vw, 3rem); margin: 0 0 1.5rem; }
h2 { font-size: 0.875rem; letter-spacing: 0.12em; margin: 2rem 0 0.5rem; font-family: inherit; font-weight: 600; }
p { margin: 0 0 0.75rem; max-width: 70ch; }
a { color: var(--link); }
a:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
.skip { position: absolute; left: 1rem; top: -4rem; padding: 0.5rem 1rem; background: var(--bg); border: 1px solid var(--border); }
.skip:focus { top: 1rem; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 0.75rem; color: var(--text); text-decoration: none; font-size: 1.25rem; }
.brand img { height: 32px; width: auto; }
.layout { display: grid; grid-template-columns: 16rem minmax(0, 1fr); gap: 2rem; max-width: 80rem; margin: 0 auto; padding: 2rem 1.5rem; }
.pages ol { list-style: none; margin: 0; padding: 0; }
.pages a { display: flex; gap: 0.75rem; padding: 0.375rem 0.75rem; border-radius: var(--radius); color: var(--text); text-decoration: none; }
.pages a:hover { text-decoration: underline; }
.pages a[aria-current="page"] { box-shadow: inset 3px 0 0 var(--primary); font-weight: 600; }
.pages span { color: var(--link); font-variant-numeric: tabular-nums; }
.pages .downloads { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
figure { margin: 0 0 2rem; }
figure img { display: block; width: 100%; height: auto; border: 1px solid var(--border); border-radius: var(--radius); }
.pager { display: flex; justify-content: space-between; gap: 1rem; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.files { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.files li { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); }
.files img { width: 72px; height: 48px; padding: 6px; object-fit: contain; border-radius: calc(var(--radius) / 2); }
footer { padding: 2rem 1.5rem; border-top: 1px solid var(--border); text-align: center; font-size: 0.875rem; }
@media (max-width: 48rem) {
  .layout { grid-template-columns: minmax(0, 1fr); }
}
`;
}

type SitePage = { id: string; title: string; path: string; depth: number };

const pathTo = (from: SitePage, to: string) => `${"../".repeat(from.depth)}${to}`;

function layout(
  ctx: GuidelineContext,
  site: SitePage[],
  current: SitePage,
  options: { title: string; description: string; logo: string },
  main: string,
): string {
  const brand = escapeHtml(ctx.brand.name);
  const nav = site
    .filter((page) => page.id !== "downloads")
    .map((page, i) => {
      const current_ = page === current ? ' aria-current="page"' : "";
      return `<li><a href="${pathTo(current, page.path)}"${current_}><span>${String(i + 1).padStart(2, "0")}</span> ${escapeHtml(page.title)}</a></li>`;
    })
    .join("\n        ");
  const downloads = site.find((page) => page.id === "downloads");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)} - ${brand} brand guidelines</title>
  <meta name="description" content="${escapeHtml(options.description)}">
  <meta name="generator" content="${escapeHtml(CREDIT_TEXT)}">
  <link rel="stylesheet" href="${pathTo(current, "assets/site.css")}">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="top">
    <a class="brand" href="${pathTo(current, site[0]?.path ?? "index.html")}"><img src="${pathTo(current, options.logo)}" alt="">${brand}</a>
    <span>Brand guidelines</span>
  </header>
  <div class="layout">
    <nav class="pages" aria-label="Brand book pages">
      <ol>
        ${nav}
      </ol>
      ${downloads ? `<p class="downloads"><a href="${pathTo(current, downloads.path)}"${downloads === current ? ' aria-current="page"' : ""}>Downloads</a></p>` : ""}
    </nav>
    <main id="main">
${main}
    </main>
  </div>
  <footer><p>${brand} brand guidelines. ${escapeHtml(CREDIT_TEXT)}</p></footer>
</body>
</html>
`;
}

/**
 * The brand book as a static site: an index.html per included page (the first page is the
 * site root), shared CSS, each page's art as SVG, the logo files and every token format.
 * Links are relative and name index.html, so the site also works opened from disk.
 */
export function brandSiteFiles(ctx: GuidelineContext, pages: GuidelinePage[]): ZipEntry[] {
  const base = slugify(ctx.brand.name);
  const site: SitePage[] = pages.map((page, i) => ({
    id: page.id,
    title: page.title,
    path: i === 0 ? "index.html" : `${page.id}/index.html`,
    depth: i === 0 ? 0 : 1,
  }));
  const downloadsPage: SitePage = { id: "downloads", title: "Downloads", path: "downloads/index.html", depth: 1 };
  site.push(downloadsPage);

  const logos = logoVariants.map((variant) => ({
    label: variant.label,
    description: variant.description,
    path: `logo/${base}-${variant.id}.svg`,
    svg: variant.render(ctx.logo),
    background: variant.background(ctx.logo),
  }));
  const formats = tokenFormats(ctx.tokens).map((format) => ({
    label: format.label,
    path: `tokens/${format.id}/${format.filename}`,
    code: format.code,
  }));
  const headerLogo = logos.find((logo) => logo.path.endsWith("-color.svg"))?.path ?? logos[0]?.path ?? "";

  const entries: ZipEntry[] = [{ name: "assets/site.css", data: stylesheet(ctx) }];
  pages.forEach((page, i) => {
    const current = site[i]!;
    const svg = page.render(ctx, i + 1);
    const art = `assets/pages/${page.id}.svg`;
    const blocks = pageBlocks(svg);
    // The h1 leads the page, even when the art draws it below a label or has no title text.
    const heading = blocks.find((block) => block.tag === "h1") ?? { tag: "h1", text: page.title };
    const rest = blocks.filter((block) => block !== heading);
    const prev = site[i - 1];
    const next = site[i + 1];
    const main = `      <h1>${escapeHtml(heading.text)}</h1>
      <figure><img src="${pathTo(current, art)}" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" alt="The ${escapeHtml(page.title)} page as designed for the brand book. Its text follows."></figure>
      ${rest.map((block) => `<${block.tag}>${escapeHtml(block.text)}</${block.tag}>`).join("\n      ")}
      <nav class="pager" aria-label="Previous and next page">
        ${prev ? `<a href="${pathTo(current, prev.path)}" rel="prev">Previous: ${escapeHtml(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a href="${pathTo(current, next.path)}" rel="next">Next: ${escapeHtml(next.title)}</a>` : ""}
      </nav>`;
    entries.push(
      { name: art, data: svg },
      {
        name: current.path,
        data: layout(ctx, site, current, { title: page.title, description: page.description, logo: headerLogo }, main),
      },
    );
  });

  // Previews sit on the background each variant is designed for, so the inverted logo still shows.
  const fileList = (items: { label: string; path: string; preview?: string }[]) =>
    items
      .map(
        (item) =>
          `<li>${item.preview ? `<img src="${pathTo(downloadsPage, item.path)}" alt="" style="background: ${escapeHtml(item.preview)}">` : ""}<a href="${pathTo(downloadsPage, item.path)}" download>${escapeHtml(item.label)}</a> <code>${escapeHtml(item.path)}</code></li>`,
      )
      .join("\n        ");
  const last = site[site.length - 2];
  const downloadsMain = `      <h1>Downloads</h1>
      <p>Logo files and design tokens for ${escapeHtml(ctx.brand.name)}, generated from the same values as the pages.</p>
      <h2>Logo</h2>
      <ul class="files">
        ${fileList(logos.map((logo) => ({ label: `${logo.label}: ${logo.description}`, path: logo.path, preview: logo.background })))}
      </ul>
      <h2>Design tokens</h2>
      <ul class="files">
        ${fileList(formats)}
      </ul>
      <nav class="pager" aria-label="Previous and next page">
        ${last ? `<a href="${pathTo(downloadsPage, last.path)}" rel="prev">Previous: ${escapeHtml(last.title)}</a>` : ""}
      </nav>`;
  entries.push({
    name: downloadsPage.path,
    data: layout(
      ctx,
      site,
      downloadsPage,
      { title: "Downloads", description: "Logo files and design tokens.", logo: headerLogo },
      downloadsMain,
    ),
  });
  entries.push(
    ...logos.map((logo) => ({ name: logo.path, data: logo.svg })),
    ...formats.map((format) => ({ name: format.path, data: format.code })),
  );
  return entries;
}

export function buildBrandSite(ctx: GuidelineContext, pages: GuidelinePage[]): Uint8Array {
  return createZip(brandSiteFiles(ctx, pages));
}
