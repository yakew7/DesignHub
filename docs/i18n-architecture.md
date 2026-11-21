# How messages load

DesignHub shows its interface in English, Spanish, French and Hindi, and German is added with its messages still in English. This page says where a message lives, how it reaches the page, and what to do when you add one. [docs/translating.md](translating.md) is the guide for translators; this one is for someone changing the code.

## The parts

Every message has a key such as `colors.tab.export`. The English text of all keys is the source of truth and is kept in parts under `lib/i18n/messages/`:

| File           | Holds                                                                                                                                                          | Loaded                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `en-core.ts`   | Keys every route needs: studio names, the home page, the palette, shared words                                                                                 | With every page              |
| `en-<area>.ts` | The keys of one area: `brand.`, `colors.`, `icons.`, `logo.`, `mockups.`, `projects.`, `social.` and `svg.` (except `svg.compare.`, which several studios use) | With the code that uses them |
| `en.ts`        | All of the above joined, for types and tests                                                                                                                   | Never in the app             |

Spanish, French and Hindi have the same parts: `es.ts` is the core, `es-colors.ts` the colors area, and so on. A language may leave a key out, and the text then shows in English.

```
en-core.ts ──────────────┐                    ┌── es.ts   (core, loaded when Spanish is chosen)
en-colors.ts ── areas/colors.ts ──registers──►│
en-projects.ts ─ areas/projects.ts            └── es-colors.ts (loaded when a file that uses colors. keys is on the page)
```

## How a part reaches the page

1. A file that uses a `colors.` key imports `lib/i18n/areas/colors.ts` (`import "@/lib/i18n/areas/colors";`). Importing it registers the English messages of the area (`registerEnglish`, in `lib/i18n/translate.ts`) and tells `lib/i18n/area-parts.ts` where the area's Spanish, French and Hindi parts are.
2. Because the import is in the files that use the keys, the area's messages are in the chunks of the routes that use them and in no other route's first load. `pnpm bundle:size` shows the effect.
3. The locale provider (`components/layout/locale-provider.tsx`) loads the core of the chosen language when it is chosen, and `area-parts.ts` fetches the part of every registered area in that language. Each part that arrives makes the translator again, so text on the page changes from English to the language.
4. A key is looked up in the language's core, then in the language's area parts, then in English (`lookup` in `translate.ts`).

The server and the first paint are always English, so hydration matches; the language arrives a moment later, as it always has.

## Adding a message

1. Add the key to the English part its prefix belongs to (`en-colors.ts` for `colors.`), or to `en-core.ts` if every route needs it. Sentence case, no em dashes, `{name}` for placeholders, `.one` and `.other` for plurals.
2. If the file that uses it is the first to use that area, add `import "@/lib/i18n/areas/<area>";` to it. Any file that uses a key of an area must import the area, or the key shows as text such as `colors.tab.export`. `pnpm check:areas` (it runs in CI and takes about a second) reads the source and fails on every file that uses a key of an area without importing it, directly or through a file of its own folder that it imports; a file that only names keys for components that import the area can opt out with `// check-areas: ignore <reason>`. `tests/e2e/no-raw-keys.spec.ts` opens every studio and each of its tabs and fails on any text that looks like a key.
3. Add the translation to the same part of `es`, `fr` and `hi` when you can (`es-colors.ts`). A key in the wrong part still works, because the core is always loaded, but keep to the part of its prefix.
4. Run `pnpm test` (keys, placeholders, complete areas) and `pnpm check:messages` (keys that nothing uses).

## Adding an area

Run `pnpm new:area <name>` (for example `pnpm new:area reports`). It creates `en-<name>.ts`, `es-<name>.ts`, `fr-<name>.ts` and `hi-<name>.ts` (empty, exporting `en<Name>` and so on) and `lib/i18n/areas/<name>.ts`, joins the new parts in `lib/i18n/messages/en.ts`, `lib/i18n/all-catalogs.ts` and `lib/i18n/areas.test.ts`, and refuses a name that exists. Then:

1. Add the keys, starting with `<name>.`, to the four parts.
2. Add `import "@/lib/i18n/areas/<name>";` to every file that uses one of them (`pnpm check:areas` finds the ones you missed).
3. Add the prefix to `completeAreas` in `lib/i18n/complete-areas.ts` when every language has all its keys.

## Adding a language

Run `pnpm new:language <code>` (for example `pnpm new:language de`). It creates the language's empty core and one empty part per area, and registers them in `locales.ts`, `all-catalogs.ts`, every `areas/<area>.ts` and `languagesInProgress` in `complete-areas.ts`. See [docs/translating.md](translating.md).

## Why it is built this way

English is the fallback for every language, so it is in every first load, and it was growing with every translated studio (about 17 kB gzipped). Loading a studio's messages with the studio, in English and in the chosen language, keeps a route's first load to the messages it shows. The cost is the rule in step 2 above, which the raw-key test enforces.
