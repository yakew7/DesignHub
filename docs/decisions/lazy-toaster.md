# The toaster loads when the first toast is raised

## Context

The toaster library was in every route's first load, and every page shows a toast only after an action.

## Decision

Toasts go through `lib/toast.ts`, which queues them until the library is loaded and the toaster is mounted (`LazyToaster`), so none is lost. The toaster's code is fetched a moment after the page has loaded, while online, so a toast raised offline still shows.

## Cost

One more module between a call and the library. A toast raised in the first moments waits for the chunk. The preload must fetch exactly what mounting needs (one loader shared by the preload and the lazy component), or a toast offline fails.

## Measured

The home page's first load was about 6 kB gzipped smaller (issue #529). `lib/toast.test.ts` covers the queue, the ids and the order; `tests/e2e/flows.spec.ts` covers a toast offline.

## Undoing it

Import `toast` from the library again and mount `<Toaster />` in the providers.
