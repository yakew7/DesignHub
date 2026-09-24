# Security Policy

DesignHub runs entirely in the browser. It has no backend, no accounts and no database of user data. User work is stored locally in the browser's IndexedDB. The app talks only to Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), the Iconify API (`api.iconify.design`, with `api.simplesvg.com` and `api.unisvg.com` as fallbacks) and, on the Vercel-hosted site only, Vercel Web Analytics (anonymous, cookie-free page-view counts). No API keys or secrets are used.

Even so, we take security seriously. Relevant issues include cross-site scripting through uploaded SVG logos, imported project JSON, fonts, icons or pasted color values; unsafe handling of downloaded files; and supply-chain problems in our dependencies.

Uploaded SVG is sanitized (scripts, `foreignObject`, event handlers and `javascript:` URLs removed) and only ever rendered through `<img>`, never injected into the page. Imported project files are validated and their logos sanitized again.

## Supported versions

| Version        | Supported         |
| -------------- | ----------------- |
| 1.0.x (latest) | ✅ Security fixes |
| < 1.0          | ❌ Not supported  |

Only the latest release on the `main` branch receives security updates. Please upgrade before reporting.

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
