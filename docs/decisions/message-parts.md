# The English catalog is in parts

## Context

English is the fallback for every language, so all of it was in every route's first load. It grew with each translated studio, to about 17 kB gzipped, and most routes show a small part of it.

## Decision

`en-core.ts` holds what every route needs. Eight areas (`brand.`, `colors.`, `icons.`, `logo.`, `mockups.`, `projects.`, `social.`, `svg.`) have their own `en-<area>.ts`, and Spanish, French and Hindi are split the same way. A file that uses an area's keys imports `lib/i18n/areas/<area>.ts`, which registers the messages and asks for the language's part. [`docs/i18n-architecture.md`](../i18n-architecture.md) has the details.

## Cost

A rule to remember: a file that uses a key of an area must import the area, or the key shows as text. `pnpm check:areas` and `tests/e2e/no-raw-keys.spec.ts` enforce it. There are more files to keep in step when a language is added (`pnpm new:language` does it).

## Measured

Every route's first load fell by 3 to 6 kB gzipped over two steps (issues #526 and #543, #544 for the other languages); the home page went from 259.6 kB to 239 kB with the toaster change. A route in Hindi downloads its studio's Hindi messages and no other studio's (`tests/e2e/language-areas.spec.ts`).

## Undoing it

Join the parts in `en-core.ts` again and delete `lib/i18n/areas/` and the imports. `lib/i18n/messages/en.ts` already joins the parts for types and tests.
