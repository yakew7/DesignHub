import vm from "node:vm";

import { describe, expect, test } from "vitest";

import { serviceWorkerSource } from "../../scripts/service-worker-source.mjs";

const ORIGIN = "https://designhub.test";

type Listener = (event: Record<string, unknown>) => void;

/** A Cache that keeps what is put in it, keyed by absolute URL, in the order it was put. */
class FakeCache {
  entries = new Map<string, Response>();
  private key = (request: string | Request) =>
    new URL(typeof request === "string" ? request : request.url, ORIGIN).href;
  async put(request: string | Request, response: Response) {
    this.entries.delete(this.key(request));
    this.entries.set(this.key(request), response);
  }
  async match(request: string | Request, options?: { ignoreSearch?: boolean }) {
    const wanted = new URL(this.key(request));
    for (const [href, response] of this.entries) {
      const url = new URL(href);
      if (options?.ignoreSearch ? url.pathname === wanted.pathname : href === wanted.href) return response;
    }
    return undefined;
  }
  async keys() {
    return [...this.entries.keys()].map((href) => new Request(href));
  }
  async delete(request: string | Request) {
    return this.entries.delete(this.key(request));
  }
}

class FakeCaches {
  stores = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(request: string | Request, options?: { ignoreSearch?: boolean }) {
    for (const store of this.stores.values()) {
      const found = await store.match(request, options);
      if (found) return found;
    }
    return undefined;
  }
}

/** Runs the worker source with a fake browser around it. */
function start(options: Parameters<typeof serviceWorkerSource>[0], caches = new FakeCaches()) {
  const listeners = new Map<string, Listener>();
  const fetched: string[] = [];
  const state = { online: true };
  const fakeFetch = async (request: string | Request) => {
    const href = new URL(typeof request === "string" ? request : request.url, ORIGIN).href;
    fetched.push(new URL(href).pathname + new URL(href).search);
    if (!state.online) throw new TypeError("offline");
    return new Response(`body of ${href}`, { status: 200 });
  };
  const self = {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    location: { origin: ORIGIN },
    skipWaiting: () => undefined,
  };
  vm.runInNewContext(serviceWorkerSource(options), { self, caches, fetch: fakeFetch, Response, Request, URL, File });

  /** Fires an event and waits for everything the worker handed to waitUntil and respondWith. */
  async function fire(type: string, event: Record<string, unknown> = {}) {
    const pending: Promise<unknown>[] = [];
    let response: Promise<Response> | undefined;
    listeners.get(type)?.({
      ...event,
      waitUntil: (work: Promise<unknown>) => pending.push(work),
      respondWith: (work: Promise<Response>) => (response = work),
    });
    await Promise.all(pending);
    return response ? await response : undefined;
  }
  const open = (path: string, init: { navigate?: boolean } = {}) => {
    const request = new Request(`${ORIGIN}${path}`);
    Object.defineProperty(request, "mode", { value: init.navigate ? "navigate" : "cors" });
    return fire("fetch", { request });
  };
  return { caches, fetched, state, fire, open };
}

const build = {
  buildId: "one",
  shell: ["/", "/icon.svg", "/_next/static/chunks/main.js"],
  routeFiles: {
    "/colors": ["/_next/static/chunks/colors.js"],
    "/typography": ["/_next/static/chunks/typography.js"],
  },
};

describe("the service worker", () => {
  test("installing downloads the shell and nothing else", async () => {
    const worker = start(build);
    await worker.fire("install");
    expect(worker.fetched.sort()).toEqual([...build.shell].sort());
    const cached = await worker.caches.open("designhub-static-one");
    expect([...cached.entries.keys()].map((href) => new URL(href).pathname).sort()).toEqual([...build.shell].sort());
  });

  test("a studio is kept the first time it is opened, files before its page", async () => {
    const worker = start(build);
    await worker.fire("install");
    worker.fetched.length = 0;
    await worker.open("/colors", { navigate: true });
    expect(worker.fetched).toEqual(["/colors", "/_next/static/chunks/colors.js", "/colors"]);
    const cached = await worker.caches.open("designhub-static-one");
    expect(await cached.match("/colors")).toBeDefined();
    expect(await cached.match("/_next/static/chunks/colors.js")).toBeDefined();
    // Opened again, nothing more is downloaded for the files.
    worker.fetched.length = 0;
    await worker.open("/colors", { navigate: true });
    expect(worker.fetched).toEqual(["/colors"]);
  });

  test("a studio the page reports is kept, one that is only prefetched is not", async () => {
    const worker = start(build);
    // A prefetch of a link is a request for the data, not for the page: nothing is kept.
    await worker.open("/typography?_rsc=abc");
    expect(worker.fetched).toEqual([]);
    await worker.fire("message", { data: { type: "REMEMBER_ROUTE", pathname: "/typography" } });
    expect(worker.fetched).toEqual(["/_next/static/chunks/typography.js", "/typography"]);
    // A path that is not a studio, or a message that is not one, does nothing.
    worker.fetched.length = 0;
    await worker.fire("message", { data: { type: "REMEMBER_ROUTE", pathname: "/elsewhere" } });
    await worker.fire("message", { data: { type: "REMEMBER_ROUTE" } });
    expect(worker.fetched).toEqual([]);
  });

  test("offline, a kept studio opens and one never opened says so", async () => {
    const worker = start(build);
    await worker.open("/colors", { navigate: true });
    worker.state.online = false;
    const kept = await worker.open("/colors", { navigate: true });
    expect(await kept?.text()).toBe("body of https://designhub.test/colors");
    const missing = await worker.open("/typography", { navigate: true });
    expect(missing?.status).toBe(503);
    expect(await missing?.text()).toContain("not on this device yet");
  });

  test("an update deletes the caches of earlier builds and keeps the shared file", async () => {
    const caches = new FakeCaches();
    await caches.open("designhub-static-old");
    await caches.open("designhub-runtime-old");
    await caches.open("designhub-share");
    await caches.open("something-else");
    const worker = start({ ...build, buildId: "two" }, caches);
    await worker.fire("install");
    await worker.fire("activate");
    expect((await caches.keys()).sort()).toEqual(["designhub-share", "designhub-static-two", "something-else"]);
  });

  test("the runtime cache keeps at most its limit, dropping the oldest", async () => {
    const worker = start({ ...build, runtimeLimit: 3 });
    for (const name of ["a", "b", "c", "d", "e"]) await worker.open(`/_next/static/chunks/${name}.js`);
    const runtime = await worker.caches.open("designhub-runtime-one");
    expect([...runtime.entries.keys()].map((href) => new URL(href).pathname)).toEqual([
      "/_next/static/chunks/c.js",
      "/_next/static/chunks/d.js",
      "/_next/static/chunks/e.js",
    ]);
  });
});

describe("the runtime cache is also capped by size", () => {
  test("it drops the oldest entries until it is under its byte limit, and keeps the newest", async () => {
    const worker = start({ ...build, runtimeBytes: 120 });
    // Each body is "body of https://designhub.test/_next/static/chunks/x.js", 55 bytes: two fit in 120, three do not.
    for (const name of ["a", "b", "c", "d"]) await worker.open(`/_next/static/chunks/${name}.js`);
    const runtime = await worker.caches.open("designhub-runtime-one");
    expect([...runtime.entries.keys()].map((href) => new URL(href).pathname)).toEqual([
      "/_next/static/chunks/c.js",
      "/_next/static/chunks/d.js",
    ]);
  });

  test("an entry bigger than the limit is still kept alone", async () => {
    const worker = start({ ...build, runtimeBytes: 10 });
    await worker.open("/_next/static/chunks/a.js");
    await worker.open("/_next/static/chunks/b.js");
    const runtime = await worker.caches.open("designhub-runtime-one");
    expect([...runtime.entries.keys()].map((href) => new URL(href).pathname)).toEqual(["/_next/static/chunks/b.js"]);
  });
});

describe("the service worker tells the page which studios it kept", () => {
  test("a studio that is kept is answered with kept true, and one it does not know with kept false", async () => {
    const worker = start(build);
    const replies: unknown[] = [];
    const source = { postMessage: (message: unknown) => replies.push(message) };
    await worker.fire("message", { data: { type: "REMEMBER_ROUTE", pathname: "/colors" }, source });
    await worker.fire("message", { data: { type: "REMEMBER_ROUTE", pathname: "/elsewhere" }, source });
    expect(replies).toEqual([
      { type: "ROUTE_REMEMBERED", pathname: "/colors", kept: true },
      { type: "ROUTE_REMEMBERED", pathname: "/elsewhere", kept: false },
    ]);
  });

  test("a studio whose page cannot be fetched is answered with kept false", async () => {
    const worker = start(build);
    worker.state.online = false;
    const replies: unknown[] = [];
    await worker.fire("message", {
      data: { type: "REMEMBER_ROUTE", pathname: "/typography" },
      source: { postMessage: (message: unknown) => replies.push(message) },
    });
    expect(replies).toEqual([{ type: "ROUTE_REMEMBERED", pathname: "/typography", kept: false }]);
  });
});
