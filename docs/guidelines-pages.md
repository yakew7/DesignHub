# Adding a Brand Guidelines page

The Brand Guidelines studio builds a brand book out of pages. Each page is one function that returns an SVG string. The same function feeds the live preview, the PDF and the website export, so a new page shows up in all of them once it is registered.

This guide explains how a page is built, how it gets its number, and what to change and test when you add one. It uses the most recent page, `lib/guidelines/pages/spacing-layout.ts` (Spacing & Layout), as the worked example. For setup, code style and the pull request process, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## The pieces

| File                             | What it does                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `lib/guidelines/types.ts`        | The `GuidelinePage` and `GuidelineContext` types, and the page size (`PAGE_WIDTH` x `PAGE_HEIGHT`).  |
| `lib/guidelines/pages/*.ts`      | One file per page, or a few related pages. Each exports `GuidelinePage` objects.                     |
| `lib/guidelines/kit.ts`          | Shared helpers: `guidelinePage`, `caption`, `card`, `paragraph` and the layout constants.            |
| `lib/guidelines/registry.ts`     | `guidelinePages`, the list of every page in book order.                                              |
| `lib/guidelines/sections.ts`     | Groups the pages into sections for the page list, and switches a whole section on or off.            |
| `lib/guidelines/book.ts`         | Renders the pages into a PDF.                                                                        |
| `lib/guidelines/outline.ts`      | Adds PDF bookmarks and makes the contents rows on the Introduction page clickable.                   |
| `lib/guidelines/site.ts`         | Builds the website export (a ZIP of static HTML, the page art as SVG, logo files and token formats). |
| `lib/guidelines/site.test.ts`    | Tests for the pages and the website export.                                                          |
| `lib/guidelines/outline.test.ts` | Tests for the PDF bookmarks and contents links.                                                      |

## What a page is

A page is a `GuidelinePage` (see `lib/guidelines/types.ts`):

```ts
export type GuidelinePage = {
  id: string; // stable, kebab-case; used in file names, URLs and the switched-off list
  section: GuidelineSection; // the group in the page list: Foundation, Logo, Color, Type, Imagery, UI, Voice or Tokens
  title: string; // shown in the contents, the PDF bookmarks and the website navigation
  description: string; // a tooltip in the page list; the website's meta description
  render: (ctx: GuidelineContext, number: number) => string; // returns an SVG document
};
```

`render` is a pure function of its arguments. It gets:

- `ctx`: everything the page can read. The ones you will use most are `ctx.brand` (the brand tokens: `spacing`, `radius`, typography and so on), `ctx.surface` (the colors for the current light or dark mode: `background`, `text`, `muted`, `primary`, `border`, `surface`), `ctx.tokens` (the same token set the Export Engine produces), `ctx.logo`, `ctx.measure` (text measuring) and `ctx.contents`.
- `number`: the page's number in the book, starting at 1.

The page is drawn on a 1600 x 1000 canvas (`PAGE_WIDTH`, `PAGE_HEIGHT`). Read values from `ctx` instead of hard-coding them, so the page follows the live brand and works in both light and dark mode. Do not hard-code colors; use `ctx.surface`.

## The page kit

`lib/guidelines/kit.ts` gives every page the same frame:

- `guidelinePage(ctx, number, { section, title, lead }, body, defs?)` draws the background, the running header (the `section` label and the page number), the large title, the optional lead paragraph, your `body` markup, and the footer. It returns the finished SVG. Almost every page ends with a call to it.
- `caption(ctx, x, y, text)` draws a small uppercase label for a block of content.
- `card(ctx, x, y, width, height)` draws a rounded panel in the surface color.
- `paragraph(ctx, text, x, y, width, size, fill, maxLines)` draws wrapped body text.
- `MARGIN`, `CONTENT_TOP`, `CONTENT_BOTTOM` and `CONTENT_WIDTH` are the area your body should stay inside, between the title and the footer.
- `text(x, y, value, options)` from `lib/mockups/kit.ts` draws one line of text. Use its `font` option: `"h"` for the heading font, `"b"` for body text and `"bb"` for bold body text.

Drawing text with these helpers matters for the website export, as described below.

## How numbering and the contents work

Pages are numbered by position, not by id. The numbers are built from the pages that are switched on:

1. `guidelinePages` in `registry.ts` is the full list, in book order.
2. The studio filters out the ids in `excluded` (the pages the user switched off).
3. The remaining pages become `ctx.contents`: `{ id, title, number }` for each page, with `number` equal to its position plus one. This is done in `withContents` in `hooks/use-guideline-context.ts`, and the same way in `buildBrandBookFrom` in `book.ts`.
4. Each page's `render` is called with its own `number`.

Two things follow from this:

- A page does not know its number ahead of time. Do not write a number into the page; use the `number` argument. If someone switches the page before yours off, your page moves up by one.
- The contents list on the Introduction page (`contentsRows` in `lib/guidelines/pages/intro.ts`) is drawn from `ctx.contents`, so a new page is listed there on its own. The rows get shorter as the book gets longer, so check that the list still fits after you add a page.

## How the PDF is built

`buildBrandBook` in `book.ts` renders every included page to an image at 2x, binds them into a PDF, then calls `addBookNavigation` from `outline.ts`. That function:

- adds one bookmark per entry in `ctx.contents`, in order, using the page `title`, and
- turns every row of the Introduction contents list into a link to its page. It finds the Introduction page by the id `introduction`.

You do not write any code for this. A registered page gets a bookmark from its `title`, so give it a short, clear title.

## How the website export works

`brandSiteFiles` in `site.ts` builds one `index.html` per included page. The first page is the site root (`index.html`); the others are `<id>/index.html`. The page art is saved as `assets/pages/<id>.svg` and shown in a `<figure>`.

The site also has real, searchable HTML text next to the art. `pageBlocks` reads the SVG you returned and turns its `<text>` elements into headings and paragraphs:

- Only text drawn with the kit's classes (`h`, `b`, `bb`) is used. That is why you should draw text with `text()` and `caption()` and not with raw `<text>` tags.
- The running header (at y = 71) and footer (at y = `PAGE_HEIGHT - 40`) are skipped, because the site has its own navigation.
- The title drawn by `guidelinePage` becomes the `<h1>`.
- A `caption` (bold body text with letter spacing) becomes an `<h2>`.
- Other text becomes `<p>`. Wrapped lines and items on one baseline are joined into one paragraph.

So the way to get a good website page is to use `guidelinePage` for the frame, `caption` for block headings and `text` or `paragraph` for the rest.

## Walkthrough: Spacing & Layout

`lib/guidelines/pages/spacing-layout.ts` is a good model because it uses every part above.

**1. Export a `GuidelinePage`.** The file ends with `export const spacingLayoutPage: GuidelinePage = { id: "spacing-layout", title: "Spacing & Layout", description: "...", render(ctx, number) { ... } }`. The id is kebab-case and does not change.

**2. Read the live values.** `render` pulls `surface` and `brand` from `ctx`. The spacing scale and radius scale come from `spacingScale(brand.spacing)` and `radiusScale(brand.radius)` in `lib/tokens/build`, so the page always matches the Export Engine. If the user changes the spacing base, the page changes with it.

**3. Lay out inside the content area.** The page uses `MARGIN`, `CONTENT_TOP`, `CONTENT_BOTTOM` and `CONTENT_WIDTH` from the kit. It splits the width into two columns (`colW`, and `rx` for the right column) and draws the spacing scale on the left and the radius scale and grid on the right.

**4. Handle extreme values.** A huge spacing base would overflow the page, so the bars are scaled down when they do not fit and the page says so ("Bars are scaled down to fit"). The grid has `fitGutter` so a large gutter can never make a column narrower than 8 units. Pure helpers like `fitGutter` and `gridColumns` are exported so tests can check them directly.

**5. Build the body, then wrap it in the frame.** The page builds a string of SVG for the body (`caption(...)` labels, bars, tiles, grid columns) and returns:

```ts
return guidelinePage(
  ctx,
  number,
  {
    section: "Layout",
    title: "Spacing and layout",
    lead: "Spacing, corner radius and grid values come from the brand tokens.",
  },
  markup,
);
```

This `section` is the label in the running header, and it can be any short word. It is not the page's `section` field, which puts the page in a group of the page list (see below). Reuse an existing header label when the new page belongs with it (for example `Color` or `Typography`).

**6. Give it a section.** Set `section` on the `GuidelinePage` to one of the groups in `guidelineSections` (`lib/guidelines/types.ts`). The page list shows a foldable group per section, each with a switch that turns all of its pages on or off, and a count of the pages that are on. Pick the group the page sits in, and register it next to that group's other pages: the list reads in book order, so a section's pages should be one run in `guidelinePages` (a test checks it).

**7. Register it.** In `lib/guidelines/registry.ts`, import the page and put it in the `guidelinePages` array. Its position in the array is its position in the book. Spacing & Layout sits after `illustrationPage` (which follows `imageryPage`), followed by `motionPage` and then `componentsPage`.

## Adding a page: checklist

1. Create `lib/guidelines/pages/<name>.ts` and export a `GuidelinePage` with a `section`. Use `guidelinePage` for the frame, and read colors and values from `ctx`.
2. Import it in `lib/guidelines/registry.ts` and add it to `guidelinePages` where you want it in the book.
3. Add tests (see the next section).
4. Run the app with `pnpm dev`, open Brand Guidelines, and check the page in both light and dark mode. Switch the page off and on, and check that the page numbers and the contents list update.
5. Export the PDF and the website, and check the page appears in both, with a bookmark in the PDF and a heading in the website page.
6. Add a line under `Unreleased` in `CHANGELOG.md`.
7. Run `pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build`.

## Tests to update

Two test files cover pages, and both need a change when you add one. A third, `lib/guidelines/sections.test.ts`, checks the sections for every registered page (each page has a section, and a section's pages are one run in book order), so it fails on its own if a new page has no section or lands in the middle of another group. It also turns each section off and checks the PDF bookmarks, the website and the Markdown export leave its pages out.

**`lib/guidelines/site.test.ts`** builds the default brand (`guidelineContext`) and the website (`site()`). Add a `describe` block for your page, like the one for "spacing and layout page", that checks:

- the page is in the site with its `<h1>` and `<h2>` headings, and is listed in the contents on `index.html`;
- when its id is passed in `excluded`, its `index.html` and `assets/pages/<id>.svg` are gone and it is not in the contents;
- its number is right (for example, one more than the page before it) and it is listed in the Introduction contents;
- it draws values from the live tokens in light and dark mode, and the SVG is well formed (`xmlError(svg)` is `null`);
- any pure helper you exported (like `gridColumns`) returns the right values, including for extreme inputs.

**`lib/guidelines/outline.test.ts`** builds a blank PDF with one page per included page. Add a test like "bookmarks the Spacing & Layout page after Imagery unless it is switched off": the bookmark with your title is in the right place, and it is gone when the page is excluded.

If you put your page right next to an existing one, the existing "numbers the page after ..." tests (in `site.test.ts`) and the matching bookmark-order tests (in `outline.test.ts`) can fail, because they assume which page comes next. Update those expectations to the new order.

Run `pnpm test` to check everything, or `pnpm vitest run lib/guidelines` to run only these tests.
