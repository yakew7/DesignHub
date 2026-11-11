import { beforeEach, describe, expect, test, vi } from "vitest";

const shown: { method: string; title: unknown; options: unknown }[] = [];

vi.mock("sonner", () => {
  const make = (method: string) => (title: unknown, options: unknown) => shown.push({ method, title, options });
  return {
    toast: Object.assign(make("message"), {
      success: make("success"),
      error: make("error"),
      info: make("info"),
      warning: make("warning"),
      loading: make("loading"),
    }),
  };
});

beforeEach(() => {
  shown.length = 0;
  vi.resetModules();
});

describe("the lazy toast", () => {
  test("a toast raised before the toaster is ready waits, and is shown in order when it is ready", async () => {
    const { toast, toasterReady } = await import("@/lib/toast");
    toast.loading("Building");
    toast("Plain");
    toast.error("Failed", { description: "why" });
    expect(shown).toEqual([]);
    await toasterReady();
    expect(shown.map((item) => item.method)).toEqual(["loading", "message", "error"]);
    expect(shown[2]?.options).toMatchObject({ description: "why" });
  });

  test("after that a toast is shown at once, with the id it was given or one that was made", async () => {
    const { toast, toasterReady } = await import("@/lib/toast");
    await toasterReady();
    const made = toast.success("Done");
    await vi.waitFor(() => expect(shown).toHaveLength(1));
    const given = toast.success("Again", { id: "same" });
    await vi.waitFor(() => expect(shown).toHaveLength(2));
    expect(given).toBe("same");
    expect(shown[0]?.options).toMatchObject({ id: made });
    expect(shown[1]?.options).toMatchObject({ id: "same" });
  });

  test("the first toast asks for the toaster once, and a listener added later is told at once", async () => {
    const { toast, onToasterWanted } = await import("@/lib/toast");
    const first = vi.fn();
    onToasterWanted(first);
    toast("a");
    toast("b");
    expect(first).toHaveBeenCalledTimes(1);
    const later = vi.fn();
    onToasterWanted(later);
    expect(later).toHaveBeenCalledTimes(1);
  });

  test("a loading toast can be replaced by its id", async () => {
    const { toast, toasterReady } = await import("@/lib/toast");
    const id = toast.loading("Working");
    await toasterReady();
    toast.success("Done", { id });
    await vi.waitFor(() => expect(shown).toHaveLength(2));
    expect(shown[1]?.options).toMatchObject({ id });
  });
});
