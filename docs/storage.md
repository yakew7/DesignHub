# What DesignHub stores, and how to reset it

DesignHub has no accounts and no server. Everything you make is saved in your own browser, on your own device. Nothing is uploaded, and other people (including the DesignHub maintainers) can't see it.

## Where it lives

| Place         | Name                                        | What's in it                                                                                                                           |
| ------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| IndexedDB     | `designhub` database, `kv` table            | The settings of every studio (one row per store, listed below).                                                                        |
| IndexedDB     | `designhub` database, `icons` table         | Icons you have opened, cached so Icon Studio keeps working offline.                                                                    |
| IndexedDB     | `designhub` database, `projects` table      | Your brand projects: one full snapshot of the brand per project.                                                                       |
| IndexedDB     | `designhub` database, `versions` table      | Version history: up to 20 earlier snapshots per project, deleted with the project.                                                     |
| localStorage  | `theme`                                     | Your light or dark theme choice (written by `next-themes`).                                                                            |
| localStorage  | `designhub:locale`                          | The interface language you picked (`en` or `es`). Without it, DesignHub follows your browser language.                                 |
| localStorage  | `designhub:panes:<studio>`                  | How wide you dragged each studio pane. Double-click a divider to reset it.                                                             |
| Cache Storage | `designhub-static-*`, `designhub-runtime-*` | On the hosted site only: the offline app shell and cached Google Fonts and Iconify responses, so DesignHub opens without a connection. |

The database and its tables are defined in [`lib/db.ts`](../lib/db.ts). Every read and write goes through `safeDb`, so blocked or broken storage never breaks a studio.

## The studio stores

Each row in the `kv` table is one Zustand store, saved under the key shown here. "In projects" means the store is part of a brand project snapshot ([`lib/projects/snapshot.ts`](../lib/projects/snapshot.ts)), so switching projects swaps it.

| Key                     | Holds                                                                            | In projects                     |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------- |
| `designhub:brand`       | Brand name, description, uploaded logo, color roles, voice, mission and values   | Yes                             |
| `designhub:colors`      | Palette swatches, shade options, gradient, contrast pair                         | Yes (palette, shades, gradient) |
| `designhub:typography`  | Heading and body fonts, type scale, rhythm, specimen, OpenType features          | Yes (fonts, scale, rhythm)      |
| `designhub:tokens`      | Export Engine settings: prefix, color format, spacing and radius bases           | Yes                             |
| `designhub:effects`     | Effects Lab settings, including the shadow the brand uses                        | Yes                             |
| `designhub:logo`        | Logo Studio view: guides, clear space, selected variant                          | Yes (clear space)               |
| `designhub:mockups`     | Mockup template, theme, copy and export scale                                    | Yes (copy and theme)            |
| `designhub:social`      | Social template, copy, design overrides, safe area, README credit, ZIP selection | Yes (copy, theme, design)       |
| `designhub:guidelines`  | Selected page, excluded pages, book theme, cover style                           | No                              |
| `designhub:project`     | Which project is open, and how the project list is sorted                        | No                              |
| `designhub:brand-dna`   | Chosen Brand DNA provider and the "Ignore background" option                     | No                              |
| `designhub:backgrounds` | Background Studio settings                                                       | No                              |
| `designhub:icons`       | Icon Studio search, selected icon, style, favorite icons                         | No                              |
| `designhub:library`     | Favorite and recent fonts, saved font pairs, saved palettes                      | No                              |
| `designhub:svg`         | SVG Playground source and optimizer options                                      | No                              |
| `designhub:a11y`        | Accessibility Lab colors, text settings and targets                              | No                              |

Uploaded images for Brand DNA are never saved. They stay in memory until you leave the page.

## Version history

Each project keeps up to 20 versions in the `versions` table (added in database version 4; older databases upgrade in place and keep every project). A version is a full brand snapshot with its project id, the time it was taken and why:

- every few minutes while you edit the open project (the state before the latest edits), and
- just before Surprise me, a token import, Brand DNA's Apply to brand, a share link import or loading a saved palette.

A version identical to the newest one is skipped, and the oldest is dropped once a project has 20. **History** on a project card lists them with a preview of what each one changes. Restoring keeps the replaced state as a new version, and the toast's **Undo** puts it straight back. Deleting a project deletes its history (undoing the delete brings both back). History is not included in project exports or share links.

## Private browsing and blocked storage

When the browser blocks IndexedDB (some private windows do, and so do "block all site data" settings), DesignHub keeps working in memory. Your work lasts until you close the tab. Brand Projects shows a notice when this happens. Export your projects as JSON if you want to keep them.

## Back up your work

- **Brand Projects:** use **Export** on a project, or **Export all**, to download `.designhub.json` files. Import them again from the same page, on any browser.
- **Assets:** anything you export (tokens, logo packs, social assets, the brand book) is a normal file and needs no backup from DesignHub.

## Reset everything

1. Export any projects you want to keep.
2. Clear DesignHub's site data:
   - **Chrome and Edge:** open DevTools, go to **Application**, then **Storage**, and click **Clear site data**. To delete only the saved work, expand **IndexedDB**, right-click `designhub` and choose **Delete database**.
   - **Firefox:** **Settings**, **Privacy & Security**, **Cookies and Site Data**, **Manage Data**, then remove the DesignHub site.
   - **Safari:** **Settings**, **Privacy**, **Manage Website Data**, then remove the DesignHub site.
3. Reload. DesignHub starts fresh with the default Acme brand.

To reset a single studio, delete its row (the key above) from the `kv` table in DevTools and reload.

## For contributors

- Persist state with Zustand's `persist` and `indexedDbStorage` from `lib/db.ts`, using a `designhub:` key, and add the store to the table above.
- If the store defines part of the brand, add it to `lib/projects/snapshot.ts` too, so projects capture it. Sanitize anything untrusted on import in `lib/projects/transfer.ts`.
- Bump the store's `version` and give it a `merge` (see `store/social-store.ts`) when you add fields, so older saved state still loads.
