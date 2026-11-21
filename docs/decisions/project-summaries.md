# The project list is drawn from summary rows

## Context

The Brand Projects list read every whole project (a full brand snapshot each) to draw cards that show a name and a date, although only the first thirty are on screen.

## Decision

Database version 6 added a `summaries` table: one small row per project (name, tags, favorite, three times), written in the same transaction as the project and filled in for older projects the first time the list opens. A card reads its whole project only when it is near the view. A later change dropped the colors from the rows. [`docs/storage.md`](../storage.md) describes it.

## Cost

A second row to keep in step with the project. Every writer goes through `saveProject` and `deleteProject`, so they stay together, and two tests prove it (`projects-summary-in-step.spec.ts`, `projects-upgrade.spec.ts`). The database version is now 6, which cannot go back.

## Measured

After a reload the list reads a handful of whole projects instead of all of them (`projects-summaries.spec.ts` counts them: fewer than the number of projects, with 150 imported). Searching and sorting also read the rows only.

## Undoing it

Draw the list from `listProjects()` again and stop writing rows. The `summaries` table can stay: older builds ignore a table they do not know.
