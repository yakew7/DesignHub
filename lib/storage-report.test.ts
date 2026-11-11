import { describe, expect, test } from "vitest";

import {
  clearOfflineCaches,
  isOfflineCache,
  measureRows,
  protectionOf,
  quotaNearlyFull,
  quotaShare,
  requestProtection,
} from "@/lib/storage-report";

describe("storage report", () => {
  test("only the static and runtime caches are offline caches", () => {
    expect(isOfflineCache("designhub-static-abc")).toBe(true);
    expect(isOfflineCache("designhub-runtime-abc")).toBe(true);
    expect(isOfflineCache("designhub-share")).toBe(false);
    expect(isOfflineCache("other-static-abc")).toBe(false);
  });

  test("rows are counted and measured as JSON", () => {
    expect(measureRows([])).toEqual({ count: 0, bytes: 0 });
    expect(measureRows([{ a: 1 }, { a: 22 }])).toEqual({ count: 2, bytes: `{"a":1}`.length + `{"a":22}`.length });
  });

  test("the room is nearly full from 80 percent, and never when the share is unknown", () => {
    expect(quotaNearlyFull(79)).toBe(false);
    expect(quotaNearlyFull(80)).toBe(true);
    expect(quotaNearlyFull(100)).toBe(true);
    expect(quotaNearlyFull(null)).toBe(false);
  });

  test("the quota share is a whole percent, and unknown when a number is missing", () => {
    expect(quotaShare(50, 200)).toBe(25);
    expect(quotaShare(1, 1000)).toBe(0);
    expect(quotaShare(undefined, 1000)).toBeNull();
    expect(quotaShare(10, 0)).toBeNull();
    expect(quotaShare(500, 100)).toBe(100);
  });

  test("clearing deletes the offline caches and leaves the share cache and others alone", async () => {
    const names = new Set(["designhub-static-1", "designhub-runtime-1", "designhub-share", "unrelated"]);
    const deleted = await clearOfflineCaches({
      keys: async () => [...names],
      delete: async (name) => names.delete(name),
    });
    expect(deleted).toBe(2);
    expect([...names].sort()).toEqual(["designhub-share", "unrelated"]);
  });
});

describe("protection", () => {
  const storage = (persisted: boolean, grants: boolean) => {
    let state = persisted;
    return {
      persisted: async () => state,
      persist: async () => {
        if (grants) state = true;
        return state;
      },
    };
  };

  test("says protected, not protected or unsupported", async () => {
    expect(await protectionOf(storage(true, false))).toBe("protected");
    expect(await protectionOf(storage(false, false))).toBe("not-protected");
    expect(await protectionOf(undefined)).toBe("unsupported");
    expect(await protectionOf({})).toBe("unsupported");
  });

  test("asking changes the state only when the browser agrees", async () => {
    expect(await requestProtection(storage(false, true))).toBe("protected");
    expect(await requestProtection(storage(false, false))).toBe("not-protected");
    expect(await requestProtection({ persisted: async () => false })).toBe("unsupported");
  });

  test("an error from the browser is not a crash", async () => {
    const broken = {
      persisted: async () => {
        throw new Error("blocked");
      },
      persist: async () => {
        throw new Error("blocked");
      },
    };
    expect(await protectionOf(broken)).toBe("unsupported");
    expect(await requestProtection(broken)).toBe("unsupported");
  });
});
