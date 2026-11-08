/**
 * The service worker, as text. Kept apart from the build step so a test can run it against a fake
 * `caches` and `fetch`.
 *
 * - Installing downloads only the shell: the home page, the files every page shares, the icons.
 * - A studio is remembered the first time it is shown online (by address, or when the page reports it): its
 *   page and the files it was built from are downloaded then, and anything it loads later is cached as it is used.
 * - A studio never opened online is not promised offline; the page says so instead of failing blank.
 * - Caches are named by build, and an update deletes the ones from earlier builds, after downloading again the
 *   studios they had kept (a few, in the background, with a connection).
 *
 * @param {{ buildId: string, shell: string[], routeFiles: Record<string, string[]>, runtimeLimit?: number }} options
 */
export function serviceWorkerSource({ buildId, shell, routeFiles, runtimeLimit = 300 }) {
  return `const BUILD_ID = ${JSON.stringify(buildId)};
const STATIC_CACHE = "designhub-static-" + BUILD_ID;
const RUNTIME_CACHE = "designhub-runtime-" + BUILD_ID;
const SHARE_CACHE = "designhub-share";
const ICONIFY_HOSTS = new Set(["api.iconify.design", "api.simplesvg.com", "api.unisvg.com"]);
/** What every page shares, downloaded when the worker installs. */
const SHELL = ${JSON.stringify(shell, null, 2)};
/** The files each studio page was built from, downloaded the first time that studio is opened. */
const ROUTE_FILES = ${JSON.stringify(routeFiles, null, 2)};
/** The most files the runtime cache keeps; the oldest go first. */
const RUNTIME_LIMIT = ${runtimeLimit};
const OFFLINE_PAGE =
  "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Offline</title>" +
  "<body style='font:16px system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem'>" +
  "<h1>This page is not on this device yet</h1>" +
  "<p>DesignHub keeps a studio for offline use the first time you open it with a connection. This one has not been opened yet. " +
  "Reconnect and open it once, and it will work offline after that.</p><p><a href=/>Go to the home page</a></p>";

const isCacheable = (response) => response.ok || response.type === "opaque";

async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - RUNTIME_LIMIT)).map((key) => cache.delete(key)));
}

async function put(cacheName, request, response) {
  if (!isCacheable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (cacheName === RUNTIME_CACHE) await trim(cache);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await put(RUNTIME_CACHE, request, response);
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => put(RUNTIME_CACHE, request, response).then(() => response)).catch(() => undefined);
  return cached || (await network) || Response.error();
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await put(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    return (await caches.match(request, { ignoreSearch: true })) || Response.error();
  }
}

/** A page: from the network when there is one, then from what was kept, then a note that says why not. */
async function navigate(request) {
  try {
    const response = await fetch(request);
    await put(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    const kept = await caches.match(request, { ignoreSearch: true });
    return kept || new Response(OFFLINE_PAGE, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
  }
}

/** Keeps a studio for offline use: its files first, then its page, so a page is never kept without its files. */
async function rememberRoute(pathname) {
  const files = ROUTE_FILES[pathname];
  if (!files) return false;
  const cache = await caches.open(STATIC_CACHE);
  if (await cache.match(pathname)) return true;
  const keep = async (url) => {
    if (await cache.match(url)) return;
    try {
      const response = await fetch(url);
      if (response.ok) await cache.put(url, response);
    } catch {}
  };
  await Promise.all(files.map(keep));
  await keep(pathname);
  // True when the page is kept now, so a caller can say which ones did not fit or could not be fetched.
  return Boolean(await cache.match(pathname));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(SHELL.map(async (url) => {
      try { const response = await fetch(url, { cache: "reload" }); if (response.ok) await cache.put(url, response); } catch {}
    }));
  })());
});

/** How many studios the last update downloaded again, for a page that asks after it loads. */
let rekept = 0;

/** The most studios an update downloads again, so it never turns into a large download. */
const REKEEP_LIMIT = 8;

/** The studios the earlier builds had kept, read before their caches go. */
async function keptRoutes() {
  const found = [];
  for (const key of await caches.keys()) {
    if (!key.startsWith("designhub-static-") || key === STATIC_CACHE) continue;
    const cache = await caches.open(key);
    for (const pathname of Object.keys(ROUTE_FILES)) {
      if (!found.includes(pathname) && (await cache.match(pathname))) found.push(pathname);
    }
  }
  return found.slice(0, REKEEP_LIMIT);
}

/** Keeps those studios again under this build, one after the other, only with a connection. A studio never kept is not downloaded. */
async function rekeep(pathnames) {
  if (self.navigator && self.navigator.onLine === false) return;
  let kept = 0;
  for (const pathname of pathnames) {
    try { if (await rememberRoute(pathname)) kept += 1; } catch {}
  }
  // The pages are told, so one that shows the kept studios can look again and say it is done. A page that
  // reloads for the update may not be listening yet, so it can ask again (STUDIOS_REKEPT_QUERY).
  rekept = kept;
  if (kept > 0) {
    const pages = await self.clients.matchAll({ type: "window" });
    for (const page of pages) page.postMessage({ type: "STUDIOS_REKEPT", kept });
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const before = await keptRoutes().catch(() => []);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("designhub-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== SHARE_CACHE).map((key) => caches.delete(key)));
    // Not waited for: the update does not hold up while the studios download.
    if (before.length > 0) void rekeep(before);
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "STUDIOS_REKEPT_QUERY" && rekept > 0) {
    event.source?.postMessage({ type: "STUDIOS_REKEPT", kept: rekept });
    rekept = 0;
  }
  // The page says which studio it is showing, so a link followed inside the app keeps its studio too.
  if (event.data?.type === "REMEMBER_ROUTE" && typeof event.data.pathname === "string") {
    const pathname = event.data.pathname;
    // The page that asked is told whether the studio is kept, so a button can show progress.
    event.waitUntil(rememberRoute(pathname).then((kept) => event.source?.postMessage({ type: "ROUTE_REMEMBERED", pathname, kept })));
  }
});

// A project file shared from another app arrives as a POST. Keep it on the device, in a cache,
// and send the page to the import prompt: nothing is uploaded.
async function receiveSharedFile(request) {
  try {
    const file = (await request.formData()).get("project");
    if (file instanceof File) {
      const cache = await caches.open(SHARE_CACHE);
      await cache.put("/shared-project", new Response(file, { headers: { "x-file-name": file.name } }));
    }
  } catch {}
  return Response.redirect(new URL("/projects?shared=1", self.location.origin).href, 303);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.origin === self.location.origin && url.pathname === "/share-target") { event.respondWith(receiveSharedFile(event.request)); return; }
  const request = event.request; if (request.method !== "GET") return;
  if (url.hostname === "fonts.googleapis.com") { event.respondWith(staleWhileRevalidate(request)); return; }
  if (url.hostname === "fonts.gstatic.com") { event.respondWith(cacheFirst(request)); return; }
  if (ICONIFY_HOSTS.has(url.hostname)) { event.respondWith(networkFirst(request)); return; }
  if (url.origin !== self.location.origin) return;
  // Opening a studio by its address keeps it. Prefetching a link does not: only a studio that is shown is kept.
  if (request.mode === "navigate" && ROUTE_FILES[url.pathname]) event.waitUntil(rememberRoute(url.pathname));
  if (request.mode === "navigate") { event.respondWith(navigate(request)); return; }
  if (url.pathname.startsWith("/_next/static/") || SHELL.includes(url.pathname)) event.respondWith(cacheFirst(request));
});
`;
}
