import { describe, expect, test } from "vitest";

import { KEEP_RECENT, recentStudioHrefs } from "@/lib/offline-recent";

describe("recentStudioHrefs", () => {
  test("lists the last studio, then the palette's studios newest first, with no repeats", () => {
    expect(
      recentStudioHrefs("typography", ["action:theme", "studio:icons", "studio:typography", "studio:logo"]),
    ).toEqual(["/typography", "/icons", "/logo"]);
  });

  test("lists nothing for a person who has used no studio", () => {
    expect(recentStudioHrefs(null, [])).toEqual([]);
    expect(recentStudioHrefs(null, ["action:shortcuts"])).toEqual([]);
  });

  test("keeps at most four and ignores an id that is not a studio", () => {
    const recent = ["studio:logo", "studio:colors", "studio:icons", "studio:svg", "studio:export", "studio:nope"];
    expect(recentStudioHrefs("typography", recent)).toHaveLength(KEEP_RECENT);
    expect(recentStudioHrefs("nope", ["studio:nope"])).toEqual([]);
  });
});
