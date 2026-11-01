import { describe, expect, test } from "vitest";

import { between, deletable, pruned, toggled, toggledAll, withRange, withTagged } from "@/lib/projects/selection";

describe("project selection", () => {
  test("toggling adds an id, then takes it out, and never changes the set it was given", () => {
    const empty = new Set<string>();
    const one = toggled(empty, "a");
    expect([...one]).toEqual(["a"]);
    expect(empty.size).toBe(0);
    expect(toggled(one, "a").size).toBe(0);
  });

  test("select all picks what is shown, and a second time clears it", () => {
    const shown = ["a", "b", "c"];
    const all = toggledAll(new Set(["a"]), shown);
    expect([...all].sort()).toEqual(shown);
    expect(toggledAll(all, shown).size).toBe(0);
    expect(toggledAll(new Set(), []).size).toBe(0);
  });

  test("an id that no longer exists leaves the selection", () => {
    expect([...pruned(new Set(["a", "gone"]), ["a", "b"])]).toEqual(["a"]);
  });

  test("a bulk delete keeps the open project and says so", () => {
    expect(deletable(new Set(["a", "open", "c"]), "open")).toEqual({ ids: ["a", "c"], keptOpen: true });
    expect(deletable(new Set(["a"]), "open")).toEqual({ ids: ["a"], keptOpen: false });
    expect(deletable(new Set(["a"]), null)).toEqual({ ids: ["a"], keptOpen: false });
  });
});

describe("range and tag selection", () => {
  const ordered = ["a", "b", "c", "d", "e"];

  test("a range runs between two projects in the order shown, whichever way it is dragged", () => {
    expect(between(ordered, "b", "d")).toEqual(["b", "c", "d"]);
    expect(between(ordered, "d", "b")).toEqual(["b", "c", "d"]);
    expect(between(ordered, "c", "c")).toEqual(["c"]);
    expect(between(ordered, "x", "c")).toEqual([]);
  });

  test("Shift and click adds the range to what was selected, and a first click adds one", () => {
    expect([...withRange(new Set(["a"]), ordered, "c", "e")].sort()).toEqual(["a", "c", "d", "e"]);
    expect([...withRange(new Set(), ordered, null, "b")]).toEqual(["b"]);
  });

  test("select tagged adds every project with the tag and keeps the rest", () => {
    const projects = [
      { id: "a", tags: ["client"] },
      { id: "b", tags: ["draft", "client"] },
      { id: "c", tags: [] },
    ];
    expect([...withTagged(new Set(["c"]), projects, "client")].sort()).toEqual(["a", "b", "c"]);
    expect([...withTagged(new Set(), projects, "none")]).toEqual([]);
  });
});
