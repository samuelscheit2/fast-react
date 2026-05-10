# Worker 750: Nested Hydration Target Claiming

## Summary

- Accepted nested private hydration replay target paths such as
  `container.childNodes[1].childNodes[0]` for target-claiming diagnostics.
- Replaced the direct-child-only claiming path check with deterministic
  container evidence: parsed child path segments, current path resolution,
  unique target path match count, retained parent chain, root container match,
  and retained hydratable lookup metadata.
- Preserved all public blockers: no hydration mutation, no replay queue drain,
  no event dispatch/replay, no listener attachment, no root execution, no
  native bridge execution, and no public compatibility claim.
- Added fail-closed coverage for stale targets, externalized targets,
  ambiguous fake containers, stale markers, missing ownership, and forged
  public-claim diagnostics.
- Audit follow-up: target claiming now requires private ownership diagnostic
  identity from the ownership factory and rejects plain forged ownership
  diagnostic/row objects even when their public fields match.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-private.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-750-nested-hydration-target-claiming.md`

## Commands Run

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-private.test.js --test-name-pattern "target claiming"`
- `node --test packages/react-dom/test/hydration-private.test.js --test-name-pattern "target claiming|hydration"`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs --test-name-pattern "nested child path|target claim"`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- Focused private hydration tests pass with 10 matching tests, including the new
  nested target claim, stale/external/ambiguous rejection cases, and forged
  plain ownership diagnostics rejection.
- Hydration boundary conformance passes with 15 tests, including the nested
  child path evidence row.
- DOM event delegation conformance passes with 17 tests, proving the event
  oracle remains unwidened.
- React DOM workspace check passes with 158 tests plus import-entrypoint smoke.
- Package surface guard passes; no package/export surface changes were made.
- `git diff --check` passes.

## Risks Or Blockers

- No blocker remains for this scoped private diagnostic.
- The new evidence is diagnostic-only and still depends on fake DOM child-list
  paths. It does not implement real hydratable instance claiming, queue
  mutation, event replay, root scheduling, or public `hydrateRoot` behavior.
- Ownership diagnostics are now consumed through a private WeakMap payload;
  this deliberately keeps the evidence non-serializable and non-forgeable.

## Recommended Next Tasks

- Keep public hydration blocked until real hydration root construction,
  hydratable cursor state, host instance/text claiming, mismatch queues, replay
  scheduling, and recoverable-error queueing are implemented together.
- If later private gates accept broader nested boundary shapes, reuse the same
  deterministic path, parent-chain, and uniqueness checks before admitting any
  target evidence.
