# `next` is pinned to an exact version

## Context

A framework update can change build output, the service worker's file list and the bundle sizes, and `next build` stops on a version that has a known advisory (as it did for 16.3.0 to 16.4.4, GHSA-mfr8-8qww-v76h).

## Decision

`package.json` names an exact `next` version, and Dependabot proposes updates as pull requests that CI must pass (build, size budgets, the whole end-to-end suite). A security update is merged as soon as CI passes. CI also audits the production dependencies and lists advisories in the job summary ([`SECURITY.md`](../../SECURITY.md)).

## Cost

An update is a pull request, never automatic. A vulnerable pinned version fails the build until it is bumped, which is the point.

## Measured

On 17 November the build failed on 16.4.3 on every run; the bump to 16.4.6 fixed it in one commit. The size budgets caught every route that grew after a framework or dependency update (`bundle-budget.json`).

## Undoing it

Use a range in `package.json`. The budgets and the end-to-end suite are then the only guard against a surprise.
