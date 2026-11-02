import { describe, expect, test, vi } from "vitest";

import { keepStudios, type WorkerLink } from "@/lib/offline-keep";

/** A worker link whose controller answers each request as `answer` says. */
function link(answer: (pathname: string) => boolean | null): WorkerLink {
  const listeners = new Set<(event: { data: unknown }) => void>();
  return {
    controller: {
      postMessage: (message) => {
        const { pathname } = message as { pathname: string };
        const kept = answer(pathname);
        if (kept !== null)
          queueMicrotask(() =>
            listeners.forEach((listener) => listener({ data: { type: "ROUTE_REMEMBERED", pathname, kept } })),
          );
      },
    },
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
}

describe("keepStudios", () => {
  test("keeps each studio in turn, reports progress and lists what failed", async () => {
    const progress: [number, number][] = [];
    const result = await keepStudios(
      ["/colors", "/svg", "/logo"],
      link((path) => path !== "/svg"),
      (done, total) => progress.push([done, total]),
    );
    expect(result).toEqual({ kept: ["/colors", "/logo"], failed: ["/svg"] });
    expect(progress).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  test("a studio that never answers fails after the timeout, and later ones still run", async () => {
    vi.useFakeTimers();
    const pending = keepStudios(
      ["/colors", "/logo"],
      link((path) => (path === "/colors" ? null : true)),
      undefined,
      1000,
    );
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({ kept: ["/logo"], failed: ["/colors"] });
    vi.useRealTimers();
  });

  test("without a worker controlling the page nothing can be kept", async () => {
    const none: WorkerLink = {
      controller: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    expect(await keepStudios(["/colors"], none)).toEqual({ kept: [], failed: ["/colors"] });
  });
});
