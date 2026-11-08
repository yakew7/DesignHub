## Summary

What changed and why. Link the issue: Closes #

## Screenshots

Before and after for UI changes, in dark and light themes.

## Checklist

- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm check:dashes` and `pnpm build` pass
- [ ] First-load JS stays within `bundle-budget.json` (see the [bundle budget guide](docs/bundle-budget.md) if `pnpm bundle:size` fails)
- [ ] Conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`)
- [ ] Tested in dark and light themes and at mobile width (375 px)
- [ ] Works with keyboard only
- [ ] No `any`, no `console.log`, no new external services without a note in `.env.example`
- [ ] Docs and `CHANGELOG.md` updated if behavior changed

## Breaking changes

None, or describe what breaks and how to migrate (stored data, exports, URLs).

## Testing completed

Describe what you tested and how (browsers, flows, exports).
