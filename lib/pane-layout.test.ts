import { describe, expect, test } from "vitest";

import { paneLayoutKey, paneRestoreScript, paneRestoreStyleId, parsePaneLayout } from "@/lib/pane-layout";

const ids = ["brand-controls", "brand-preview", "brand-output"];
const layout = { "brand-controls": 30, "brand-preview": 40, "brand-output": 30 };

describe("parsePaneLayout", () => {
  test("accepts a layout for exactly these panels", () => {
    expect(parsePaneLayout(JSON.stringify(layout), ids)).toEqual(layout);
  });

  test.each([
    ["missing", null],
    ["not JSON", "{oops"],
    ["an array", "[30, 40, 30]"],
    ["another studio's panels", JSON.stringify({ a: 30, b: 40, c: 30 })],
    ["a missing panel", JSON.stringify({ "brand-controls": 50, "brand-preview": 50 })],
    ["an extra panel", JSON.stringify({ ...layout, extra: 0 })],
    ["a non-number", JSON.stringify({ ...layout, "brand-output": "30" })],
    ["a zero size", JSON.stringify({ "brand-controls": 0, "brand-preview": 70, "brand-output": 30 })],
    ["sizes that don't add up", JSON.stringify({ ...layout, "brand-output": 10 })],
  ])("rejects %s", (_, raw) => {
    expect(parsePaneLayout(raw, ids)).toBeNull();
  });
});

describe("paneRestoreScript", () => {
  function run(stored: string | null, throws = false) {
    const head: { id: string; textContent: string }[] = [];
    const localStorage = {
      getItem: (key: string) => {
        if (throws) throw new Error("SecurityError");
        return key === paneLayoutKey("brand") ? stored : null;
      },
    };
    const document = {
      getElementById: (id: string) => head.find((item) => item.id === id) ?? null,
      createElement: () => ({ id: "", textContent: "" }),
      head: { appendChild: (node: { id: string; textContent: string }) => head.push(node) },
    };
    new Function("localStorage", "document", paneRestoreScript("brand", ids, "64rem"))(localStorage, document);
    return head;
  }

  test("injects a stylesheet sizing each pane from a valid saved layout", () => {
    const [style] = run(JSON.stringify(layout));
    expect(style.id).toBe(paneRestoreStyleId("brand"));
    expect(style.textContent).toContain("@media (min-width:64rem)");
    expect(style.textContent).toContain('[id="brand"]>[id="brand-preview"]{flex:40 1 0px!important}');
  });

  test("does nothing for invalid layouts or blocked storage", () => {
    expect(run(null)).toHaveLength(0);
    expect(run(JSON.stringify({ ...layout, "brand-output": 10 }))).toHaveLength(0);
    expect(run(JSON.stringify(layout), true)).toHaveLength(0);
  });
});
