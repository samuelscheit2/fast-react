# Worker 944: React DOM Root Update Native Handoff Currentness

## Summary

- Added a shared private validation boundary before public-facade `root.render` update native handoff mirroring.
- The boundary revalidates source-owned lifecycle request-boundary evidence, same-container snapshot currentness, active initial host-output ownership, fake-DOM host-output update evidence, no replayed native handoff for the update record, and consumed HostComponent/HostText commit update rows when that private metadata path is used.
- Exposed diagnostic currentness booleans on private update records:
  - `lifecycleContainerSnapshotCurrent`
  - `hostOutputUpdateCurrent`
  - `rootCommitHostComponentUpdateCurrent`
  - `updateNativeHandoffCurrent`
- Public roots, native execution, reconciler execution, real browser DOM mutation, Scheduler/act/flushSync, hydration, event/ref behavior, and package compatibility remain blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`

## Evidence

- Existing path: adapter/root `root.render` routes to private public-facade host-output render for the first render and host-output update for later renders. The update path creates a lifecycle request boundary, applies fake-DOM host updates, optionally consumes source-owned HostComponent/HostText update metadata, then mirrors the update record through the native handoff shell.
- New validation fails closed before native mirroring if lifecycle evidence is stale/cloned/cross-root, same-container currentness moved, lifecycle container snapshot is stale, host-output update evidence is missing/stale, HostComponent/HostText rows were not consumed by the current handoff, or the update record already has a native handoff.
- Focused tests now assert positive currentness flags for both plain fake-DOM update and HostComponent/HostText update metadata.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js packages/react-dom/test/react-dom-private-root-bridge-shell.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- No known blocker.
- The new checks are intentionally private and local to `root-bridge.js`; they do not expose a public `updateNativeHandoff` API.
- Active React DOM workers may overlap in nearby lifecycle/resource/event sections of `root-bridge.js`; merge should preserve this update handoff validation before native mirroring.

## Recommended Next Tasks

- Audit any future public-facade update paths that mirror native requests to reuse this currentness pattern before native handoff creation.
