# What DesignHub stores, and how to reset it

DesignHub has no accounts and no server. Everything you make is saved in your own browser, on your own device. Nothing is uploaded, and other people (including the DesignHub maintainers) can't see it.

## Where it lives

| Place         | Name                                                                                                  | What's in it                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IndexedDB     | `designhub` database, `kv` table                                                                      | The settings of every studio (one row per store, listed below).                                                                                                                                                                                |
| IndexedDB     | `designhub` database, `icons` table                                                                   | Icons you have opened, cached so Icon Studio keeps working offline.                                                                                                                                                                            |
| IndexedDB     | `designhub` database, `projects` table                                                                | Your brand projects: one full snapshot of the brand per project.                                                                                                                                                                               |
| IndexedDB     | `designhub` database, `versions` table                                                                | Version history: up to 20 earlier versions per project (the newest whole, the rest as changes from the next newer one), deleted with the project.                                                                                              |
| IndexedDB     | `designhub` database, `kv` table, keys `designhub:brand-dna-key` and `designhub:brand-dna-openai-key` | The key (and model, and for the OpenAI-compatible provider the endpoint) you pasted for a Brand DNA AI provider, and whether you reviewed what it sends. Never in a project, export, share link or version history. Removed by **Remove key**. |
| Cache Storage | `designhub-share`                                                                                     | Only for a moment: a project file shared to the installed app, kept on the device until the import prompt reads and deletes it.                                                                                                                |
| IndexedDB     | `designhub` database, `handles` table                                                                 | The folder you chose for autosave (a directory handle, never its contents). Chromium browsers only.                                                                                                                                            |
| localStorage  | `theme`                                                                                               | Your light or dark theme choice (written by `next-themes`).                                                                                                                                                                                    |
| localStorage  | `designhub:locale`                                                                                    | The interface language you picked (`en` or `es`). Without it, DesignHub follows your browser language.                                                                                                                                         |
| localStorage  | `designhub:panes:<studio>`                                                                            | How wide you dragged each studio pane. Double-click a divider to reset it.                                                                                                                                                                     |
| Cache Storage | `designhub-static-*`, `designhub-runtime-*`                                                           | On the hosted site only: the app shell, each studio the first time you open it online, and cached Google Fonts and Iconify responses, so a studio you opened opens without a connection. The runtime cache keeps at most 300 files.            |

The database and its tables are defined in [`lib/db.ts`](../lib/db.ts). Every read and write goes through `safeDb`, so blocked or broken storage never breaks a studio.

## The studio stores

Each row in the `kv` table is one Zustand store, saved under the key shown here. "In projects" means the store is part of a brand project snapshot ([`lib/projects/snapshot.ts`](../lib/projects/snapshot.ts)), so switching projects swaps it.

| Key                         | Holds                                                                                                                     | In projects                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `designhub:brand`           | Brand name, description, uploaded logo, color roles, voice, mission and values                                            | Yes                             |
| `designhub:colors`          | Palette swatches, shade options, gradient, contrast pair                                                                  | Yes (palette, shades, gradient) |
| `designhub:typography`      | Heading and body fonts, type scale, rhythm, specimen, OpenType features                                                   | Yes (fonts, scale, rhythm)      |
| `designhub:tokens`          | Export Engine settings: prefix, color format, spacing and radius bases; also which format is open (not part of a project) | Yes (settings only)             |
| `designhub:effects`         | Effects Lab settings, including the shadow the brand uses                                                                 | Yes                             |
| `designhub:logo`            | Logo Studio view: guides, clear space, selected variant                                                                   | Yes (clear space)               |
| `designhub:mockups`         | Mockup template, theme, copy and export scale                                                                             | Yes (copy and theme)            |
| `designhub:social`          | Social template, copy, design overrides, safe area, README credit, ZIP selection                                          | Yes (copy, theme, design)       |
| `designhub:guidelines`      | Selected page, excluded pages, book theme, cover style                                                                    | No                              |
| `designhub:project`         | Which project is open, how the project list is sorted, and its favorites and tag filters                                  | No                              |
| `designhub:brand-dna`       | Chosen Brand DNA provider and the "Ignore background" option                                                              | No                              |
| `designhub:backgrounds`     | Background Studio settings                                                                                                | No                              |
| `designhub:icons`           | Icon Studio search, selected icon, style, favorite icons                                                                  | No                              |
| `designhub:library`         | Favorite and recent fonts, saved font pairs, saved palettes                                                               | No                              |
| `designhub:svg`             | SVG Playground source and optimizer options                                                                               | No                              |
| `designhub:a11y`            | Accessibility Lab colors, text settings and targets                                                                       | No                              |
| `designhub:mode`            | Simple or Advanced mode                                                                                                   | No                              |
| `designhub:pane`            | The pane each studio showed last on a phone (Controls, Preview or Output)                                                 | No                              |
| `designhub:panels`          | Which collapsible control panels you folded                                                                               | No                              |
| `designhub:nav`             | Which sidebar groups you folded, and whether the sidebar is collapsed to icons                                            | No                              |
| `designhub:command-recents` | The last few actions you ran from the command palette (names, never content)                                              | No                              |

Uploaded images for Brand DNA are never saved. They stay in memory until you leave the page.

## Opening and sharing project files (installed app)

In Chromium, once DesignHub is installed, double clicking a `.designhub.json` file opens the app (a `file_handlers` entry in the web app manifest), and sharing a project file from another app sends it to DesignHub (a `share_target`). Nothing is uploaded: the launch queue hands the page the file directly, and a shared file is answered by the service worker, which keeps it in the `designhub-share` cache and redirects to Brand Projects with `?shared=1`. The page reads and deletes it, validates and sanitizes it like **Import**, shows an import prompt, and on **Import** adds the projects as new ones. An invalid, oversized (over 25 MB) or non-JSON file shows a message and changes nothing, and the open project is never replaced. Browsers without file handlers (Firefox, Safari) see no change.

Manual test plan: build and start the app, install it from Chrome, export a project, double click the `.designhub.json` file, and check the prompt names the project; cancel and confirm nothing was added; repeat with a renamed text file and with a broken JSON file.

## The Storage panel

**Brand Projects, Storage** shows what DesignHub keeps on this device: the number and size of projects, version history, the icon cache and the offline caches, and the share of the space this browser allows. Only counts and sizes are read; no project content is shown or sent. **Clear the offline cache** deletes the `designhub-static-*` and `designhub-runtime-*` caches and nothing else (projects, settings and the share cache stay), and the studios you opened are kept again the next time you open them with a connection.

## Protecting the data and keeping studios offline

The Storage panel also says whether the browser has promised to keep this site's data (`navigator.storage.persisted()`). When it has not, **Protect my data** asks (`navigator.storage.persist()`); the browser may say no, and the panel says what happened. It never asks until the button is pressed. **Keep studios for offline use** lists every studio with its state. Choose some and press Keep: the page asks the service worker for each one, the worker keeps its page and files and answers, and the panel reports how many were kept, the size added and any that could not be fetched. Nothing is downloaded until then.

## Trimming old versions

The Storage panel lists the projects that take the most room, with their history counted apart. **Delete versions older than** 30, 90 or 365 days shows how many versions that would remove, deletes them, and offers an Undo. The newest version of each project is always kept, and only the oldest part of a history is removed, so what is left is still a whole chain (see [Version history](#version-history)).

## Version history

Each project keeps up to 20 versions in the `versions` table (added in database version 4; older databases upgrade in place and keep every project). A version is a brand snapshot with its project id, the time it was taken and why. The newest version of a project is stored whole, and each older one as the change that takes the next newer version back to it (`lib/projects/delta.ts` and `version-storage.ts`), so twenty versions cost about the size of their edits and not twenty copies of the brand. Reading rebuilds every version whole, so history, restore and compare work as before, and rows written before this stay valid with no database change:

- every few minutes while you edit the open project (the state before the latest edits), and
- just before Surprise me, a token import, Brand DNA's Apply to brand, a share link import or loading a saved palette.

A version identical to the newest one is skipped, and the oldest is dropped once a project has 20. **History** on a project card lists them with a preview of what each one changes. Restoring keeps the replaced state as a new version, and the toast's **Undo** puts it straight back. Deleting a project deletes its history (undoing the delete brings both back). History is not included in project exports or share links.

## Autosave to a folder (Chromium)

In Chrome, Edge, Brave and other Chromium browsers, **Brand Projects** has an **Autosave to a folder** control. Pick a folder on your computer and DesignHub also writes every project there as `<project-name>-<project-id>.designhub.json` (the same file **Export** produces, without history), so your work survives clearing site data and can live in Git or a cloud-synced folder. Firefox and Safari don't offer folder access to websites, so the control is hidden there and everything works as before.

- **When it writes:** about 1.5 seconds after a project is saved (itself a moment after your last edit), one file at a time. A file that already holds the same project is left alone, so reloading never touches your files. **Save now** writes every project at once.
- **File names:** the slugified project name (at most 40 characters), a hyphen and the project id. Renaming a project writes the new file and removes the old one with the same id. DesignHub only ever creates, overwrites or removes `*.designhub.json` files directly inside the chosen folder, never in subfolders or anywhere else. Deleting a project in DesignHub does not delete its file.
- **The folder is remembered:** the directory handle is stored in the `handles` table (added in database version 5; older databases upgrade in place and keep every row), not the files themselves. After a reload the browser may require permission again before DesignHub can write. The control then shows **Allow access**, and one click restores autosave. If the browser still remembers the permission, nothing is asked.
- **Status:** the control shows the folder name, when the last write finished, and a message if something failed (permission refused, folder moved or deleted, disk full). Failed writes are retried the next time something saves or you click **Save now**.
- **Stop:** forgets the folder and removes the saved handle. The files already in the folder stay.

Importing a file from the folder works like any other import, from **Import** on the same page.

## Private browsing and blocked storage

When the browser blocks IndexedDB (some private windows do, and so do "block all site data" settings), DesignHub keeps working in memory. Your work lasts until you close the tab. Brand Projects shows a notice when this happens. Export your projects as JSON if you want to keep them.

## Back up your work

- **Brand Projects:** use **Export** on a project, **Export all** (one file) or **Export as ZIP** (one `.designhub.json` per project, named like the folder autosave names them) to download your projects. Import them again from the same page, on any browser.
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
