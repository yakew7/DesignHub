import { beforeEach, describe, expect, test, vi } from "vitest";

import { locales, type Locale } from "@/lib/i18n/locales";
import type { registerAreaLoaders as RegisterAreaLoaders } from "@/lib/i18n/area-parts";
import type { Catalog } from "@/lib/i18n/translate";

beforeEach(() => vi.resetModules());

const part = (text: string) => async (): Promise<Catalog> => ({ "colors.demo.label": text }) as Catalog;

type Loaders = Parameters<typeof RegisterAreaLoaders>[1];

/** Loaders for every language except English (so a new language needs no edit here), with the ones the test cares about replaced. */
const loadersWith = (given: Partial<Loaders>): Loaders => {
  const others = locales.filter((locale): locale is Exclude<Locale, "en"> => locale !== "en");
  return { ...Object.fromEntries(others.map((locale) => [locale, part("x")])), ...given } as Loaders;
};

describe("the other languages' area parts", () => {
  test("nothing is fetched while the language is English", async () => {
    const { registerAreaLoaders, setActiveLocale, areaMessages } = await import("@/lib/i18n/area-parts");
    const es = vi.fn(part("Hola"));
    setActiveLocale("en");
    registerAreaLoaders("colors", loadersWith({ es, fr: part("Salut"), hi: part("नमस्ते") }));
    expect(es).not.toHaveBeenCalled();
    expect(areaMessages("es")).toBeUndefined();
  });

  test("an area registered in another language is fetched once, and only for that language", async () => {
    const { registerAreaLoaders, setActiveLocale, areaMessages, areaPartsVersion, subscribeAreaParts } =
      await import("@/lib/i18n/area-parts");
    const es = vi.fn(part("Hola"));
    const fr = vi.fn(part("Salut"));
    const heard = vi.fn();
    subscribeAreaParts(heard);
    setActiveLocale("es");
    registerAreaLoaders("colors", loadersWith({ es, fr, hi: part("नमस्ते") }));
    setActiveLocale("es");
    await vi.waitFor(() => expect(areaMessages("es")).toEqual({ "colors.demo.label": "Hola" }));
    expect(es).toHaveBeenCalledTimes(1);
    expect(fr).not.toHaveBeenCalled();
    expect(areaPartsVersion()).toBe(1);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  test("an area that appears later is fetched when it appears, and the translator reads the part", async () => {
    const { registerAreaLoaders, setActiveLocale, areaMessages } = await import("@/lib/i18n/area-parts");
    const { createTranslator } = await import("@/lib/i18n/translate");
    setActiveLocale("fr");
    registerAreaLoaders("colors", loadersWith({ es: part("Hola"), fr: part("Salut"), hi: part("नमस्ते") }));
    await vi.waitFor(() => expect(areaMessages("fr")).toBeDefined());
    const { t } = createTranslator({}, "fr");
    expect((t as (key: string) => string)("colors.demo.label")).toBe("Salut");
    // Another language reads English (the key itself here, as nothing is registered).
    const english = createTranslator({}, "es").t as (key: string) => string;
    expect(english("colors.demo.label")).toBe("colors.demo.label");
  });

  test("a part that fails to load is asked for again later", async () => {
    const { registerAreaLoaders, setActiveLocale, areaMessages } = await import("@/lib/i18n/area-parts");
    let calls = 0;
    const flaky = async (): Promise<Catalog> => {
      calls += 1;
      if (calls === 1) throw new Error("offline");
      return { "colors.demo.label": "Hola" } as Catalog;
    };
    setActiveLocale("es");
    registerAreaLoaders("colors", loadersWith({ es: flaky, fr: part("x"), hi: part("x") }));
    await vi.waitFor(() => expect(calls).toBe(1));
    expect(areaMessages("es")).toBeUndefined();
    setActiveLocale("es");
    await vi.waitFor(() => expect(areaMessages("es")).toEqual({ "colors.demo.label": "Hola" }));
  });
});
