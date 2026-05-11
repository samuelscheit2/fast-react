# Worker 874 - React DOM Lifecycle Boundary Hardening

## Summary

- Added a private lifecycle request boundary for React DOM public-facade host-output render, update, nested update, and unmount paths.
- The boundary validates that newly consumed render/update/unmount source records are the next active request in the root-owned request arrays before fake-DOM mutation or native handoff metadata consumption.
- Added WeakMap-backed ownership for lifecycle container snapshot captures so cloned/caller-built container snapshots are not recognized as source-owned.
- Tightened caller-provided lifecycle source record overrides: exact createRoot records still validate through the private root payload, while caller-provided render/update/unmount source records fail closed as stale snapshots.
- Moved render source-record override validation before public-facade root work-loop metadata option access.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-874-react-dom-lifecycle-boundary-hardening.md`

## Evidence

- Positive private facade lifecycle paths remain symbol-private and continue to use WeakMap-backed request payloads, root payload request arrays, and source-owned lifecycle container snapshots.
- Negative package coverage now rejects cloned/cross-root create records, stale same-root update source records, cloned update records, cross-root update records, caller-built unmount records, and cross-root unmount records without mutating the target fake DOM or creating update diagnostics.
- Package coverage also verifies invalid render source records reject before a `rootWorkLoopFinishedWorkMetadata` getter is consumed.
- Conformance coverage now checks stale/cross-root private lifecycle source records, cloned lifecycle snapshot non-recognition, unchanged target fake DOM, no update diagnostics, and unchanged public placeholder boundary.

## Checks

- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - passed
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed
- `npm run check --workspace @fast-react/react-dom` - passed
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed
- `git diff --check` - passed

## Risks Or Blockers

- No known blockers.
- This is intentionally private hardening only; it does not claim public `createRoot`, `hydrateRoot`, native/Rust execution, or public React DOM root compatibility.

## Recommended Next Tasks

- Keep future private facade lifecycle consumers using the boundary helper before fake-DOM mutation or native handoff consumption.
- When public root execution is implemented, keep these private diagnostics separate from public compatibility admission.
