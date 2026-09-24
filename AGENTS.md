# Agent guide for DesignHub

Instructions for AI coding agents (and a quick reference for people) working in this repository. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Next.js 16

This project uses Next.js 16, which has breaking changes from earlier versions: APIs, conventions and file structure may differ from what you remember. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (the docs that match the installed version) and follow any deprecation notices.

Next.js can rewrite this file for agents on `next dev`. That is turned off with `agentRules: false` in `next.config.ts`, so this guide stays as written.

## Rules

- Use pnpm. Before finishing, run `pnpm typecheck && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build`.
- TypeScript is strict. Never use `any`.
- Never use em dashes, in code, comments, docs or data. Use normal punctuation (a comma, colon, period or parentheses) or a spaced hyphen. `pnpm check:dashes` and the Em dash CI workflow fail on any em dash.
- Never duplicate state. Colors live in the color store, fonts in the typography store, radius and spacing in the tokens store, and shadow in the effects store. Brand features read them through `useBrandTokens()`.
- Render untrusted SVG only through `<img>` data URLs, and sanitize uploaded or imported SVG with `sanitizeSvg`.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). Don't add Co-Authored-By trailers.
