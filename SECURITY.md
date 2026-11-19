# Security Policy

DesignHub runs entirely in the browser. It has no backend, no accounts and no database of user data. User work is stored locally in the browser's IndexedDB. The app talks only to Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), the Iconify API (`api.iconify.design`, with `api.simplesvg.com` and `api.unisvg.com` as fallbacks) and, on the Vercel-hosted site only, Vercel Web Analytics (anonymous, cookie-free page-view counts). No API keys or secrets of ours are used. One opt-in feature talks to a fourth party: if you choose the Brand DNA **AI (your key)** provider and paste your own key, a downscaled copy of the images you approved is sent to `api.anthropic.com` (or, for the OpenAI-compatible provider, the endpoint you entered, which may be a server on your own machine). The key is stored only in your browser's IndexedDB under its own record, is never written to exports, project files, share links or version history, and is removed with one click.

Even so, we take security seriously. Relevant issues include cross-site scripting through uploaded SVG logos, imported project JSON, fonts, icons or pasted color values; unsafe handling of downloaded files; and supply-chain problems in our dependencies.

Uploaded SVG is sanitized (scripts, `foreignObject`, event handlers and `javascript:` URLs removed) and only ever rendered through `<img>`, never injected into the page. Imported project files are validated and their logos sanitized again. That includes files opened through the installed app's file handler and share target: they are read on the device (the service worker keeps a shared file in a local cache, never uploads it), size-limited, validated and sanitized exactly like a normal import, and nothing is added without confirmation.

The offline cache (a service worker) keeps only files from DesignHub's own origin, Google Fonts and the Iconify hosts above, on the device, and the heavy background generators run in a worker the page starts from its own code; neither one sends your work anywhere. Reports about either one, for example a file from another origin reaching the cache, are in scope.

Reports about the AI provider's key handling (for example the key reaching storage, logs, exports or any host other than the provider) are in scope.

## Supported versions

| Version        | Supported         |
| -------------- | ----------------- |
| 1.2.x (latest) | ✅ Security fixes |
| < 1.2          | ❌ Not supported  |

Only the latest release on the `main` branch receives security updates. Please upgrade before reporting.

## Dependency advisories

Every run of the CI workflow audits the production dependencies (`pnpm audit --prod`) and lists any known advisory in the job summary (`scripts/audit-summary.mjs`). A high or critical advisory fails the job; a moderate or lower one is listed and fixed in the next dependency update. `next build` itself also stops on a Next.js version that has a known advisory, so a vulnerable framework version does not ship. Dependabot proposes the updates; a security update is merged as soon as CI passes.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately through GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Include:
   - a description of the issue and its impact
   - steps to reproduce, or a proof of concept
   - affected versions, browsers or configurations
   - any suggested fix, if you have one

If you can't use GitHub's reporting, contact a maintainer through their GitHub profile and ask for a private channel. Don't include vulnerability details in that first message.

## Response timeline

| Stage                                   | Target                                     |
| --------------------------------------- | ------------------------------------------ |
| Acknowledgement of your report          | within **3 business days**                 |
| Initial assessment and severity rating  | within **7 days**                          |
| Fix for critical / high severity issues | within **30 days**                         |
| Fix for medium / low severity issues    | next scheduled release, within **90 days** |

We will keep you informed of progress and may ask for more details along the way.

## Disclosure policy

We follow **coordinated disclosure**:

1. We confirm the issue and determine the affected versions.
2. We prepare and test a fix, and publish a patched release.
3. We publish a GitHub Security Advisory describing the issue, and credit you unless you'd rather stay anonymous.
4. We ask reporters to wait until the fix is released, or 90 days after the report (whichever comes first), before public disclosure. If an issue is being actively exploited, we may speed this up.

Thank you for helping keep DesignHub and its users safe.
