# Your first contribution

This walkthrough follows one real change from fork to merged pull request: adding a social template to the [Social Media Studio](../README.md#social-media-studio). The example is a Patreon cover (1600 x 400), but the steps are the same for any template, and most of them are the same for any change.

[CONTRIBUTING.md](../CONTRIBUTING.md) is the reference for setup, code style and the other guides (mockups, export formats, backgrounds, effects). This page shows how the pieces fit together in order, and links back to it rather than repeating it. The [glossary](glossary.md) explains terms such as safe area and brand tokens.

## 1. Pick an issue

Issues labelled [`good first issue`](https://github.com/yakew7/DesignHub/labels/good%20first%20issue) list where to look and what "done" means. Comment on the issue to claim it, so two people don't build the same thing. For a new template that has no issue yet, open one first with the platform, its exact size and a link to the platform's own size guidance.

## 2. Fork and clone

Fork [yakew7/DesignHub](https://github.com/yakew7/DesignHub) with the **Fork** button on GitHub, then clone your fork and add the original as `upstream`:

```bash
git clone https://github.com/<your-username>/DesignHub.git
cd DesignHub
git remote add upstream https://github.com/yakew7/DesignHub.git
```

With the [GitHub CLI](https://cli.github.com), `gh repo fork yakew7/DesignHub --clone` does all three.

## 3. Create a branch

Branch from an up-to-date `main`, with a prefix from the [branch naming table](../CONTRIBUTING.md#branch-naming):

```bash
git switch main
git pull upstream main
git switch -c feat/patreon-cover
```

## 4. Install and run

You need Node.js 22 or newer and pnpm 11 (see [Development setup](../CONTRIBUTING.md#development-setup)):

```bash
nvm use            # reads .nvmrc (Node 22)
corepack enable    # provides the pnpm version pinned in package.json
pnpm install
pnpm dev
```

Open [http://localhost:3000/social](http://localhost:3000/social). There is no backend and no API key, so the app works straight away. Leave `pnpm dev` running: it reloads as you edit.

## 5. Make the change

A social template is a pure function from a drawing context (the brand's colors, fonts and logo, plus the copy from the Content panel) to an SVG string. The [Mockup and social template guidelines](../CONTRIBUTING.md#mockup-and-social-template-guidelines) list the rules. In practice the change touches four files.

### Add the platform name

If the platform is new, add it to the `SocialPlatform` union in `lib/social/types.ts`:

```ts
  | "Behance"
  | "Patreon";
```

TypeScript then makes sure every template's `platform` is spelled the same way.

### Write the template

Create `lib/social/templates/patreon.ts`. Start from a template with a similar shape; `lib/social/templates/tumblr.ts` is a good wide banner to copy:

```ts
import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1600;
const H = 400;
// Patreon crops the cover on narrow screens, so keep content in the middle.
const SAFE = { x: 200, y: 40, width: 1200, height: 320 };

export const patreonCover: SocialTemplate = {
  id: "patreon-cover",
  platform: "Patreon",
  label: "Cover",
  width: W,
  height: H,
  description: "Creator page cover, 1600 × 400. Narrow screens crop the sides.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background !== "solid";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const mark = 120;
    const left = SAFE.x + ctx.layout.padding / 2;
    const textX = left + mark + 40;
    const maxWidth = SAFE.x + SAFE.width - textX;
    const name = heading(ctx, content.name, textX, 190, maxWidth, 72, on, { maxLines: 1 });
    const headline = wrap(ctx, content.headline, maxWidth, 32, "b", 1)[0] ?? "";
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: left, y: H / 2 - mark / 2, width: mark, height: mark }, onColor ? on : undefined, "patreon-mark")}
      ${name.markup}
      ${text(textX, 250, headline, { size: 32, fill: on, opacity: 0.88 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
```

The points that matter:

- Every color, font and the logo come from `ctx`. Never hard-code a brand value; the brand lives in its own stores and reaches templates through the context.
- `text()` escapes the copy, `wrap()` and `heading()` measure it with the real font, and `logo()` needs a unique id prefix for each copy of the logo.
- `backdrop(ctx, W, H, own)` lets the Background setting in the Content panel replace your design's own background.
- `safe` is the area every crop keeps. Add `covered` rects for anything platform UI draws on top (avatars, buttons).
- Look up the size on the platform's help pages, and say where it came from in the pull request.

### Register it

Add the template, and the platform if it is new, in `lib/social/registry.ts`:

```ts
import { patreonCover } from "@/lib/social/templates/patreon";

export const socialTemplates: SocialTemplate[] = [
  // ...
  behanceCover,
  patreonCover,
];

export const socialPlatforms: SocialPlatform[] = [
  // ...
  "Behance",
  "Patreon",
];
```

Registering is all it takes for the template to appear in the picker, the PNG export and the social ZIP pack.

### Add a test

`lib/social/templates.test.ts` already renders every registered template in light and dark mode, checks the SVG is well formed at the declared size, and renders it with a brand name full of characters that need escaping. `lib/social/registry.test.ts` checks that ids are unique and that safe areas fit the canvas. So the only test to add is the size row in `registry.test.ts`:

```ts
  ["behance-cover", 808, 632],
  ["patreon-cover", 1600, 400],
```

## 6. Check it in the browser

In the studio at `/social`, pick **Patreon > Cover** and turn on **Show safe area** in the Content panel. Then go through item 7 of the [template guidelines](../CONTRIBUTING.md#mockup-and-social-template-guidelines) and the pull request checklist:

- Light and dark themes (the theme toggle in the header).
- A long brand name and a long headline, so nothing overflows the safe area.
- An uploaded non-square logo.
- Each option of the Background setting.
- Download the PNG and look at it at full size.

## 7. Run the tests and the full check

While you work, run the tests in watch mode, or once:

```bash
pnpm exec vitest lib/social    # watches the social tests
pnpm test                      # runs every test once
```

Before you push, run the full check. It is the same set of commands CI runs, so if it passes locally the pull request checks will pass too:

```bash
pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build
```

If `format:check` fails, `pnpm format` fixes it. If `check:dashes` fails, replace each em dash it lists with a comma, colon, period or spaced hyphen (see [Writing style](../CONTRIBUTING.md#writing-style)).

## 8. Commit and push

Commit messages follow [Conventional Commits](../CONTRIBUTING.md#commit-style):

```bash
git add lib/social
git commit -m "feat(social): add Patreon cover template"
git push -u origin feat/patreon-cover
```

Since this change adds a feature people will see, also add a line under the unreleased section of `CHANGELOG.md` and the platform to the Social Media list in `README.md`, in the same pull request.

## 9. Open the pull request

```bash
gh pr create --repo yakew7/DesignHub --base main --fill
```

Or open your fork on GitHub and use the **Compare & pull request** button. Fill in the [template](../.github/PULL_REQUEST_TEMPLATE.md): a summary with `Closes #<issue>`, before and after screenshots in dark and light, the checklist, and what you tested.

## 10. What the checks do

These workflows in `.github/workflows/` run on your pull request:

| Workflow          | What it runs                                                                                                          | Fails when                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `ci.yml`          | `pnpm install --frozen-lockfile`, then `typecheck`, `test`, `lint`, `format:check` and `build` on Node 22             | Any of those fail, or `pnpm-lock.yaml` doesn't match `package.json`                           |
| `typecheck.yml`   | `pnpm typecheck`                                                                                                      | TypeScript reports an error                                                                   |
| `lint.yml`        | `pnpm lint` and `pnpm format:check`                                                                                   | ESLint reports an error, or a file isn't formatted with Prettier                              |
| `em-dash.yml`     | `node scripts/check-em-dash.mjs`                                                                                      | Any file contains an em dash                                                                  |
| `bundle-size.yml` | Builds your branch and its base, then compares each route's first-load JS ([details](../CONTRIBUTING.md#bundle-size)) | A route grows by more than 10% gzipped                                                        |
| `lighthouse.yml`  | Builds the app and runs Lighthouse CI on the home page and four studios ([details](../CONTRIBUTING.md#lighthouse))    | Accessibility, best practices or SEO score below 100 (performance below 90 is only a warning) |
| `welcome.yml`     | Posts a welcome comment on your first issue or pull request                                                           | Never; it doesn't check out or run your code                                                  |

`release.yml` only runs when a maintainer publishes a release. On a first pull request from a fork, GitHub may hold the checks until a maintainer approves the run; that is normal.

When a check fails, open it from the **Checks** tab, find the failing step, reproduce it locally with the same `pnpm` command, fix it and push again.

## 11. Review and merge

A maintainer reviews the pull request. Answer feedback with new commits on the same branch rather than force-pushing, so the review history stays readable:

```bash
git add lib/social
git commit -m "fix(social): keep the Patreon headline inside the safe area"
git push
```

Once the checks are green and the review is approved, the maintainer merges it (squash or rebase). Afterwards, update your fork and delete the branch:

```bash
git switch main
git pull upstream main
git push origin main
git branch -d feat/patreon-cover
git push origin --delete feat/patreon-cover
```

After a squash merge `git branch -d` may say the branch is not fully merged; `git branch -D` deletes it anyway. That's it: your change ships with the next deploy. Pick another issue, or ask in [Discussions](https://github.com/yakew7/DesignHub/discussions) if you get stuck.
