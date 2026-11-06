# Troubleshooting

Common problems, what causes them and how to fix them. DesignHub has no server and no account, so almost everything comes down to what your browser allows. The [storage guide](storage.md) lists exactly what is kept and where.

1. [My work disappeared after I cleared site data](#my-work-disappeared-after-i-cleared-site-data)
2. [My work is not saved at all](#my-work-is-not-saved-at-all)
3. [Fonts do not load offline](#fonts-do-not-load-offline)
4. [Icon Studio fails or shows no icons](#icon-studio-fails-or-shows-no-icons)
5. [A download is blocked or nothing happens](#a-download-is-blocked-or-nothing-happens)
6. [Folder autosave asks for permission again](#folder-autosave-asks-for-permission-again)
7. [The folder autosave control is missing](#the-folder-autosave-control-is-missing)
8. [I still see an old version after an update](#i-still-see-an-old-version-after-an-update)
9. [The language does not switch](#the-language-does-not-switch)
10. [How do I reset everything?](#how-do-i-reset-everything)
11. [The installed app](#the-installed-app)

## My work disappeared after I cleared site data

**Cause:** Your projects and settings live only in your browser (IndexedDB and localStorage). Clearing cookies and site data, "Delete browsing data on exit" settings and some privacy tools remove them. DesignHub has no server copy to restore from.

**Fix:**

- If you exported projects, import the `.designhub.json` files again from **Brand Projects**, **Import**.
- If you had **Autosave to a folder** turned on, the files are still in that folder. Import them from **Brand Projects**, then turn autosave on again.
- Otherwise the data is gone. To avoid this next time, use **Export all**, turn on folder autosave (Chromium browsers), or exclude the DesignHub site from automatic cleanup.

## My work is not saved at all

**Cause:** Some private windows and "block all site data" settings block IndexedDB. DesignHub then keeps working in memory and your work lasts until you close the tab. **Brand Projects** shows a notice when this happens.

**Fix:** Open DesignHub in a normal window, or allow site data for it, and reload. Until then, use **Export** to download your projects. See [Private browsing and blocked storage](storage.md#private-browsing-and-blocked-storage).

## Fonts do not load offline

**Cause:** Fonts in the Typography Studio come from Google Fonts. The hosted site caches the font stylesheets and files you have already used, but a font you never loaded while online is not in the cache. Self-hosted copies that are not served over HTTPS (or `localhost`) have no service worker, so nothing is cached at all.

**Fix:**

- Connect once and open the fonts you want (pick them in the Typography Studio) so they are cached, then go offline. The cache is the `designhub-runtime-*` entry in Cache Storage.
- A browser that was in a private window, or whose site data was cleared, starts with an empty cache. Load the fonts again while online.
- Exported brand kits embed or reference fonts separately, so check the export when you need fonts to work without a connection.
- Until a font loads, the browser shows a fallback font. Your selection is still saved.

## Icon Studio fails or shows no icons

**Cause:** Icon Studio searches the Iconify API (`api.iconify.design`, with `api.simplesvg.com` and `api.unisvg.com` as fallbacks). A corporate firewall, VPN, DNS filter or ad blocker can block all of these hosts. Icons you opened before are cached in the `icons` table and the runtime cache, so those keep working offline.

**Fix:**

- Ask your network administrator to allow the three Iconify hosts, or try another network.
- Disable the ad blocker or privacy extension for the DesignHub site.
- Open the icons you need once on an open network. They are then available offline.
- Everything outside Icon Studio works without Iconify.

## A download is blocked or nothing happens

**Cause:** Exports (tokens, logo packs, social assets, the brand book) are created in the browser and saved as ordinary downloads. Browsers can block several downloads at once ("This site wants to download multiple files"), downloads from an embedded or sandboxed frame, or downloads when a policy forbids them. Some pop-up blockers also interfere.

**Fix:**

- Allow multiple downloads for the site when the browser asks, or in the site settings, then export again.
- Prefer the single ZIP option in the Social and Logo studios over many separate files.
- Open DesignHub in its own tab rather than inside another page.
- Check the browser's download list and the download folder. A managed browser may block certain file types.

## Folder autosave asks for permission again

**Cause:** DesignHub remembers the folder you chose (a directory handle in the `handles` table, never the files themselves). After a reload or a new browser session, the browser may require you to grant write access again before DesignHub is allowed to write. This is a browser security rule.

**Fix:** Click **Allow access** in the folder autosave control, then accept the prompt. If the browser still remembers the permission, nothing is asked. If the control reports that the folder was moved or deleted, or the permission was refused, choose **Stop**, then **Autosave to a folder** and pick the folder again. Failed writes are retried the next time something saves, or when you click **Save now**.

## The folder autosave control is missing

**Cause:** Folder access is only offered by Chromium browsers (Chrome, Edge, Brave and similar). Firefox and Safari do not let websites write to folders, so the control is hidden there.

**Fix:** Use **Export** and **Export all** in **Brand Projects** to back up your work in those browsers.

## I still see an old version after an update

**Cause:** On the hosted site, a service worker installs the app shell and keeps each studio the first time you open it online, so it opens offline. When a new version is deployed, the new worker installs in the background and waits. DesignHub shows an **Update available** toast with a **Reload** button, and the old version keeps running until you use it (or close every tab of the site). Only production builds register the worker, and it starts a few seconds after the page has loaded.

**Fix:**

- Click **Reload** in the toast. If you dismissed it, reload the page or close all DesignHub tabs and open it again.
- Still old? Open DevTools, **Application**, **Service Workers**, tick **Update on reload** or click **Unregister**, then reload. Under **Storage**, **Clear site data** also removes the old caches, but see [Reset everything](#how-do-i-reset-everything) first, because it removes saved work too. To clear only the caches, delete the `designhub-static-*` and `designhub-runtime-*` entries under **Cache Storage**.
- Your saved work is not part of the cache, so an update never changes it.
- Studios you had kept for offline use stay kept. When the new version takes over, it reads which studios the old one held before deleting its caches, then downloads those again in the background (at most eight, only with a connection, and never a studio you had not kept). The update does not wait for it. The **Storage** panel on the Projects page marks which studios are kept.

## The language does not switch

**Cause:** The language you pick is saved in localStorage as `designhub:locale`. If localStorage is blocked, the choice is lost on reload. Without a saved choice, DesignHub follows your browser language. Also, not every screen is translated yet: untranslated screens stay in English even when another language is selected.

**Fix:**

- Choose the language again from the language menu, then reload.
- Allow site data for DesignHub, or remove a stale `designhub:locale` entry (DevTools, **Application**, **Local Storage**) and choose again.
- Missing or wrong text? See the [translation guide](translating.md) to help improve it.

## How do I reset everything?

1. Export any projects you want to keep.
2. Clear DesignHub's site data (this removes IndexedDB, localStorage and the offline caches, and the service worker will be reinstalled on the next visit):
   - **Chrome and Edge:** DevTools, **Application**, **Storage**, **Clear site data**.
   - **Firefox:** **Settings**, **Privacy & Security**, **Cookies and Site Data**, **Manage Data**, remove the DesignHub site.
   - **Safari:** **Settings**, **Privacy**, **Manage Website Data**, remove the DesignHub site.
3. Reload. DesignHub starts fresh with the default Acme brand.

To reset only one studio, delete its row from the `kv` table of the `designhub` IndexedDB database and reload. Files written by folder autosave are never deleted by DesignHub. The full list of keys is in the [storage guide](storage.md#reset-everything).

## The installed app

DesignHub can be installed as a Progressive Web App. Once installed in Chromium, it can open `.designhub.json` files and appear as a share target. How those features work is described in the [storage guide](storage.md#opening-and-sharing-project-files-installed-app). The sections below cover the problems people hit with the installed app. The development server does not register a service worker, so install, file open and share target only apply to the hosted site or a local `pnpm build && pnpm start` session.

### The install button is missing

**Cause:** Browsers only offer install when the page is served over HTTPS (or `localhost`), the web app manifest is valid, and a service worker is registered. DesignHub registers the worker a few seconds after load, and only in production builds (`components/layout/pwa-register.tsx`). There is no in-app install button: the browser shows its own control in the address bar or app menu. Firefox and Safari use a different "Add to Home Screen" / "Add to Dock" flow and do not expose Chromium's install icon.

**Fix:**

- **Chrome and Edge:** Open the hosted site (or `http://localhost` after `pnpm build && pnpm start`), wait a few seconds, then look for the install icon in the address bar, or open the browser menu and choose **Install DesignHub** / **Apps** > **Install this site as an app**. If nothing appears, open DevTools, **Application**, **Manifest** and **Service Workers**: fix any manifest errors, and confirm a worker is registered for the origin. Private windows and some enterprise policies hide install.
- **Safari (macOS):** **File** > **Add to Dock**, or share the page and choose **Add to Dock**. On iOS/iPadOS use **Share** > **Add to Home Screen**. Safari does not show a Chromium-style install icon.
- Self-hosted copies need HTTPS (or localhost). A plain `http://` LAN IP will not become installable.

### A `.designhub.json` file does not open in DesignHub

**Cause:** Opening a project file by double click uses the manifest `file_handlers` entry (`app/manifest.ts`), which points at `/projects`. That only works after DesignHub is installed as an app in a Chromium browser. Firefox and Safari have no web file handlers, so double click does nothing special there. The file also has to keep the `.designhub.json` extension; a renamed `.json` or `.txt` file is not claimed.

**Fix:**

- **Chrome and Edge:** Install DesignHub first (see above). Export a project from **Brand Projects**, then double click the downloaded `.designhub.json` file. The installed app should open **Brand Projects** and ask before importing. If another app owns the extension, right click the file, **Open with**, and pick DesignHub, or reinstall the app so the handler is registered again. You can always use **Import** on the Brand Projects page instead.
- **Safari:** There is no file handler. Use **Import** in **Brand Projects**, or drag the file into that page.

### The share target does not appear

**Cause:** The share target is declared in the manifest (`share_target` posts to `/share-target`). The service worker answers that POST, keeps the file in the short-lived `designhub-share` cache, and redirects to Brand Projects with `?shared=1` (see `scripts/generate-service-worker.mjs`). The target only shows up for the installed app, and only in browsers that implement the Web Share Target API (Chromium on desktop and Android). Safari and Firefox do not list DesignHub as a share destination for files.

**Fix:**

- **Chrome and Edge (installed app):** From another app's share sheet, or from the browser's share UI for a `.designhub.json` / JSON file, choose DesignHub. If it is missing, confirm the app is installed (not just a normal tab), then close every DesignHub window, reopen the installed app once so the worker is active, and try again. Uninstalling and reinstalling refreshes the share target registration.
- **Safari:** Share target is not available. Use **Import** in **Brand Projects**.

### The installed app still shows an old version after an update

**Cause:** Same as [I still see an old version after an update](#i-still-see-an-old-version-after-an-update): a new service worker installs in the background and waits until you reload. An installed (standalone) window is easy to leave open, so the waiting worker never activates.

**Fix:**

- Click **Reload** in the **Update available** toast. If you dismissed it, close every DesignHub window (the installed app and any browser tabs on the same origin), then open the app again.
- **Chrome and Edge:** Open the installed app, press F12 (or open DevTools from the app's menu if available), go to **Application** > **Service Workers**, click **Unregister**, then reload. You can also delete only the `designhub-static-*` and `designhub-runtime-*` caches under **Cache Storage** (see below).
- **Safari:** Close the app, then **Settings** > **Privacy** > **Manage Website Data** (macOS: **Safari** > **Settings** > **Privacy** > **Manage Website Data**), remove the DesignHub site if you are ready to clear its data, and reopen. For a cache-only reset without wiping projects, use the Develop menu's storage tools when enabled, or see the next section.

### How to reset the offline cache

**Cause:** The offline shell and runtime responses live in Cache Storage as `designhub-static-*` and `designhub-runtime-*`. Clearing them forces a fresh download on the next visit without deleting your projects in IndexedDB. The short-lived `designhub-share` cache only holds a file mid-import; leave it alone unless a share import is stuck.

**Fix:**

- **In the app:** **Brand Projects, Storage, Clear the offline cache** removes exactly these caches and keeps your projects. Use it first.
- **Chrome and Edge:** DevTools > **Application** > **Cache Storage**. Delete `designhub-static-*` and `designhub-runtime-*`. Leave the `designhub` IndexedDB database untouched if you want to keep your work. Then reload (or close and reopen the installed app).
- **Safari:** Enable the Develop menu if needed. Open the storage inspector for the DesignHub site and remove the DesignHub caches, or remove the site under **Manage Website Data** when you are fine clearing everything (export projects first). Then reload.
- To wipe projects, settings and caches together, use [How do I reset everything?](#how-do-i-reset-everything) instead.

Still stuck? Open an issue on [GitHub](https://github.com/yakew7/DesignHub/issues) with your browser, its version and what you tried.
