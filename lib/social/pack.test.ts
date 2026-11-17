import { beforeEach, describe, expect, test, vi } from "vitest";

import { socialContext } from "@/lib/test/draw-context";

const rasterize = vi.hoisted(() => vi.fn());
vi.mock("@/lib/export/raster", () => ({ rasterize }));

import { buildSocialPack } from "@/lib/social/pack";

beforeEach(() => {
  rasterize.mockReset();
  rasterize.mockResolvedValue({ bytes: new Uint8Array([1, 2, 3]), width: 10, height: 10 });
});

describe("buildSocialPack", () => {
  test("builds a ZIP of the chosen templates only, reporting progress", async () => {
    const progress: [number, number][] = [];
    const zip = await buildSocialPack(socialContext("light"), (done, total) => progress.push([done, total]), [
      "x-banner",
      "linkedin-cover",
    ]);
    expect(rasterize).toHaveBeenCalledTimes(2);
    expect(progress).toEqual([
      [1, 2],
      [2, 2],
    ]);
    expect(zip.length).toBeGreaterThan(0);
  });

  test("writes the README in the language given, and in English when none is", async () => {
    const readme = async (text?: Parameters<typeof buildSocialPack>[4]) => {
      const zip = await buildSocialPack(socialContext("light"), undefined, ["x-banner"], undefined, text);
      return new TextDecoder().decode(zip);
    };
    const english = await readme();
    expect(english).toContain("social assets");
    const spanish = await readme({
      title: (brand) => `Recursos sociales de ${brand}`,
      describe: (template) => `DESC ${template.id}`,
    });
    expect(spanish).toContain("Recursos sociales de ");
    expect(spanish).toContain("DESC x-banner");
    expect(spanish).not.toContain("social assets");
  });

  test("stops between templates when cancelled, and rasterizes nothing more", async () => {
    const controller = new AbortController();
    rasterize.mockImplementation(async () => {
      controller.abort();
      return { bytes: new Uint8Array([1]), width: 1, height: 1 };
    });
    await expect(
      buildSocialPack(
        socialContext("light"),
        undefined,
        ["x-banner", "linkedin-cover", "github-classic"],
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(rasterize).toHaveBeenCalledTimes(1);
  });

  test("a signal that is already aborted rasterizes nothing", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      buildSocialPack(socialContext("light"), undefined, ["x-banner"], controller.signal),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(rasterize).not.toHaveBeenCalled();
  });
});
