# Frequently Asked Questions

## Where is my data?

Everything you make in DesignHub is saved in your own browser, on your own device, using IndexedDB and localStorage. There is no account or application backend for storing your work.

See the [storage guide](storage.md) for exactly what is stored and where.

## Does DesignHub work offline?

A studio works offline once you have opened it online on that device: the first time a studio is shown, DesignHub keeps its page and files. A studio you never opened online says so when you are offline, and works after you open it once with a connection. To prepare ahead, **Brand Projects, Storage, Keep studios for offline use** downloads the studios you choose now. Icon search through Iconify and Google Fonts previews require an internet connection.

On the hosted site, a small app shell is installed at once and each studio is added as you open it.

See the [README](../README.md) for more information about privacy and external services.

## Can I use my exports commercially?

DesignHub is released under the MIT License. Review the [LICENSE](../LICENSE) file for the applicable terms.

Some exported files carry a small credit in their file metadata, not on the artwork itself.

## Which browsers does DesignHub support?

A formal browser support matrix is not currently documented. DesignHub relies on browser features such as IndexedDB to save your work.

Some private browsing modes or browser settings may block persistent storage. See the [storage guide](storage.md#private-browsing-and-blocked-storage) for what happens when storage is unavailable.

## How do I reset DesignHub?

Export any projects you want to keep, then clear DesignHub's site data from your browser's developer tools or privacy settings and reload.

Full step-by-step instructions for Chrome, Edge, Firefox and Safari, including how to reset a single studio, are in the [storage guide](storage.md#reset-everything).

## What happens if my browser blocks storage?

DesignHub keeps working in memory when persistent storage is unavailable. Your work lasts until you close the tab, and Brand Projects shows a notice when this happens.

Export your projects as JSON first if you want to keep them.

See [Private browsing and blocked storage](storage.md#private-browsing-and-blocked-storage).

## How do I back up or move my work to another browser or computer?

Use Export on a project, Export all, or Export as ZIP (one `.designhub.json` per project) in Brand Projects to download your projects. Import them again from the same page on another browser.

Exported assets, such as tokens, logo packs, social assets and the brand book, are normal files and need no separate backup from DesignHub.

See the [storage guide](storage.md#back-up-your-work).

## Something is not working. Where do I look?

See the [troubleshooting guide](troubleshooting.md) for work lost after clearing site data, fonts or icons failing offline, blocked downloads, folder autosave permissions, old versions after an update, language problems and how to reset everything.

## How do I add a new mockup or social template?

Follow the Mockup and social template guidelines in the [Contributing guide](../CONTRIBUTING.md), which explains how to add and register templates.

## Can I host my own copy?

Yes. DesignHub needs no environment variables, API keys or database: build it with `pnpm build` and serve it with `pnpm start`, or deploy it to Vercel, Netlify or Docker. Analytics only load on Vercel, so a self-hosted copy sends nothing.

See the [self-hosting guide](self-hosting.md).

## Does DesignHub send my designs anywhere?

Your saved projects and settings stay in your browser. DesignHub does not use an application backend to store your work.

Some features use external services, such as Google Fonts and Iconify. The hosted site also uses anonymous Vercel Analytics.

See the [Privacy section of the README](../README.md) for details.
