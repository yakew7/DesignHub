import { registerEnglish } from "@/lib/i18n/translate";

/**
 * The studio areas of the English catalog. A route loads the areas it shows before it draws (see
 * `EnglishAreas`), so the English messages of the other studios are not in its first load.
 */
const loaders = {
  icons: () => import("@/lib/i18n/messages/en-icons").then((module) => module.enIcons),
  logo: () => import("@/lib/i18n/messages/en-logo").then((module) => module.enLogo),
  mockups: () => import("@/lib/i18n/messages/en-mockups").then((module) => module.enMockups),
  social: () => import("@/lib/i18n/messages/en-social").then((module) => module.enSocial),
  svg: () => import("@/lib/i18n/messages/en-svg").then((module) => module.enSvg),
} as const;

export type EnglishArea = keyof typeof loaders;

const loading = new Map<string, Promise<void>>();

/** Loads and registers the English messages of some areas. One promise per set of areas, so it can be read with `use`. */
export function loadEnglishAreas(areas: readonly EnglishArea[]): Promise<void> {
  const id = [...areas].sort().join(",");
  let promise = loading.get(id);
  if (!promise) {
    promise = Promise.all(
      areas.map(async (area) => {
        registerEnglish(await loaders[area]());
      }),
    ).then(() => undefined);
    loading.set(id, promise);
  }
  return promise;
}
