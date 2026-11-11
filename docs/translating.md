# Translation Guide

This guide explains how to add a new language or improve an existing translation in DesignHub.

## 1. How translations work

DesignHub stores its translations in `lib/i18n/messages/`. The English catalog is the source of truth. It is in parts: `en-core.ts` (what every route needs) and one file per big studio (`en-icons.ts`, `en-logo.ts`, `en-mockups.ts`, `en-social.ts`, `en-svg.ts`), which load with their studio; `en.ts` joins them for types and tests. A new key goes in the part its prefix belongs to (`icons.` in `en-icons.ts`), or in `en-core.ts`. Other language catalogs can be incomplete, and missing translations fall back to English.

Use the existing translation system instead of writing translated UI text directly in components.

Some areas must be complete in every language, and a test fails when a key is missing, naming the key and the language. Those areas are listed in `completeAreas` in `lib/i18n/complete-areas.ts`. Any area that is not in that list falls back to English until someone translates it, so a studio at a time is a good first contribution. The Icon, SVG, Mockup and Social studios are done, including the template descriptions (the social pack README, which is file content, stays English). When you finish translating an area in every language, add its prefix to `completeAreas` so it stays complete.

## 2. Improve an existing translation

1. Open `lib/i18n/messages/` and select the language file you want to improve, such as `es.ts`, `fr.ts`, or `hi.ts`.
2. Find the translation key in `lib/i18n/messages/en-core.ts` or the `en-<area>.ts` that matches its prefix.
3. Update the corresponding translated text while preserving the meaning of the English message.
4. Keep all placeholders, such as `{name}` and `{count}`, unchanged.
5. Use sentence case and avoid em dashes.
6. Save your changes.

## 3. Add a new language

1. Choose a two-letter language code.
2. Create a file named `lib/i18n/messages/<code>.ts`.
3. Copy the structure and keys from the English parts (`en.ts` joins them).
4. Translate the values while preserving every key and placeholder.
5. Export the catalog using the existing TypeScript pattern, `satisfies Catalog`.
6. Register the language in `lib/i18n/locales.ts`. Update `locales`, `localeNames` and the `loaders` table (the app downloads only the language in use, so a new language is one `import()` line there), following the existing examples. The tests read every language from `lib/i18n/all-catalogs.ts`, so add the new language there too.
7. Check that the translations are natural and consistent.

If you are unsure how to translate a message, leave it in English rather than guessing.

## 4. Preserve placeholders and plurals

Some messages contain placeholders, such as `{name}` or `{count}`. Keep their names exactly as they appear in English.

For plural messages, preserve the existing plural structure, including `.one` and `.other` keys where present. Check how the application uses `plural()` before translating these messages.

Do not rename or remove translation keys.

## 5. Check fonts and text overflow

DesignHub uses Inter and Space Grotesk for Latin-script text.

If a language uses another writing system, check whether the current fonts support it. If necessary, add suitable system fonts to `--font-sans` and `--font-display` in `app/globals.css`, following the existing font configuration.

`tests/e2e/translations-fit.spec.ts` opens every studio at 320 px in Spanish, French and Hindi and fails when the page scrolls sideways or a button, tab or radio cuts its text off (an ellipsis is allowed), naming the studio. Long translations may wrap differently from English. Test the interface at a narrow mobile width and check buttons, navigation, cards, and headings for clipping or overflow.

## 6. Test your translations

From the project root, install dependencies if needed and run:

```bash
pnpm install
pnpm test
pnpm check:dashes
```

The translation tests check catalog keys, placeholders, and prohibited em dashes. Fix any failures before submitting your changes.

Start the application using the instructions in the repository README. Use the language switcher in the header to select your language, then inspect the main interface and Brand Projects at desktop and mobile widths.

## 7. Capture screenshots

Include screenshots that show the language switcher and the translated interface when contributing translation changes.

The existing Home screenshot can be used as a visual reference:

![DesignHub Home screenshot showing the language selector](screenshots/home.png)

To capture an updated screenshot, run the application, select a language using the header language switcher, and take a screenshot of the application. Save the image in `docs/screenshots/` and link it from this guide.

## 8. Final checklist

- [ ] Translation keys match the English catalog.
- [ ] Placeholders and plural keys are preserved.
- [ ] The language is registered in `lib/i18n/locales.ts`.
- [ ] Fonts support the language's writing system.
- [ ] The interface has been checked at mobile and desktop widths.
- [ ] `pnpm test` passes.
- [ ] `pnpm check:dashes` passes.
- [ ] Screenshots are included when appropriate.

## 7. Unused messages

The English catalog is loaded by every route, so a message nothing uses costs bytes everywhere. `pnpm check:messages` lists the English keys that no source file refers to (a key built from a template such as `studio.${id}.short` or a prefix counts as used if its shape matches). CI runs it as a warning. Remove a listed key from `en.ts`, `es.ts`, `fr.ts` and `hi.ts` together, and say in the pull request what you removed. Use `--strict` to make it fail.
