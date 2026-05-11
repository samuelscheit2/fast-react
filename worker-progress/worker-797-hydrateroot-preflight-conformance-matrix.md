# Worker 797: hydrateRoot Preflight Conformance Matrix

## Summary

Added focused matrix coverage proving the private `hydrateRoot` public-facade
preflight rows compose only as blocked evidence. The new package and
conformance tests chain marker/listener preconditions, recoverable-error
metadata ownership, target-claim ownership, and event replay dispatch metadata
through the same request and verify public hydration, DOM, listener, replay,
callback, and compatibility surfaces remain blocked.

## Changed Files

- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-797-hydrateroot-preflight-conformance-matrix.md`

## Evidence Gathered

- The matrix records share canonical WeakMap-backed payload identity from the
  hydrateRoot request through marker/listener, target claiming, recoverable
  error preflight, and replay execution rows.
- The replay execution payload retains the same dispatch record, target claim,
  target-dispatch link, hydration boundary record, and recoverable-error
  metadata as the source hydrateRoot preflight.
- Missing marker/listener preflight evidence, missing target-claiming evidence,
  and copied/tampered target-claim rows are rejected before event replay can be
  admitted.
- Public `hydrateRoot`, root objects, DOM mutation, marker writes, listener
  installation, replay queue draining, event dispatch, callback invocation, and
  compatibility claims remain blocked in the checked rows.

## Commands Run

- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`

## Risks Or Blockers

- No blockers.
- Merge risk is limited to overlapping edits in the hydrateRoot private
  preflight sections of `react-dom-private-root-bridge-shell.test.js` and
  `react-dom-root-public-facade-blocked-gate.test.mjs`. No implementation files
  were changed.

## Recommended Next Tasks

- If another worker changes hydrateRoot preflight record shapes, re-run the
  focused bridge-shell and conformance tests to catch payload identity drift.
