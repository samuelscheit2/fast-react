# Worker 770: hydrateRoot Target-Claiming Preflight

Date: 2026-05-11

## Goal Evidence

- Resumed in the assigned worker worktree:
  `/Users/user/Developer/Developer/fast-react-worker-770-hydrateroot-target-claiming-preflight`.
- `get_goal` returned `null` in the resumed session, so there was no active
  tool goal available to inspect before this report.
- Work stayed scoped to private React DOM hydrateRoot preflight diagnostics,
  focused tests, and this progress report.

## Summary

Implemented a private `hydrateRoot` target-claiming preflight gate behind the
existing symbol-only `react-dom/client.hydrateRoot` private facade preflight.
The new gate builds on the already accepted hydrateRoot public-facade
preflight and its marker/listener preflight, then collects private hydration
target-dispatch, ownership, and target-claiming diagnostics without admitting
public hydration, replay, dispatch, DOM mutation, root scheduling, native
execution, or reconciler execution.

The gate is fail-closed. It rejects raw hydrateRoot request records, rejects
stale marker/listener state, requires canonical immutable WeakMap-backed
target-claiming evidence, records blocked public capability evidence, and
retains the public package surface unchanged.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-private.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-770-hydrateroot-target-claiming-preflight.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md` and `ORCHESTRATOR.md` for worker boundaries,
  reporting expectations, and private/public package-surface constraints.
- Confirmed the working tree is on
  `worker/770-hydrateroot-target-claiming-preflight`.
- Added a private hydrateRoot target-claiming preflight record type, status,
  accepted capability ids, blocked capability ids, hidden WeakMap payload, and
  private record/payload accessors in `root-bridge.js`.
- Added `preflightTargetClaiming(...)` and
  `getHydrateRootTargetClaimingPreflightRecords()` to the private hydrateRoot
  public-facade preflight object.
- Added
  `assertCanonicalPrivateHydrationTargetClaimingDiagnostic(...)` in
  `hydration-boundary-gate.js` to validate frozen canonical private evidence
  before root-bridge can record target claiming.
- Verified the root-bridge path calls the public-facade preflight bridge's
  hydration boundary gate, so patched gates and non-canonical diagnostic
  returns are testable.
- Added package tests for canonical payload acceptance, immutable target-path
  evidence, cloned-claim rejection, successful hydrateRoot target-claiming
  preflight, raw request rejection, and non-canonical preflight evidence
  rejection.
- Added a conformance test proving the private target-claiming preflight remains
  canonical and keeps the public hydrateRoot blocker unchanged.
- No nested agents were spawned.

## Commands Run

```sh
pwd && git status --short && git branch --show-current
git diff --stat
git diff -- packages/react-dom/src/client/root-bridge.js | sed -n '1,260p'
git diff -- packages/react-dom/src/client/hydration-boundary-gate.js packages/react-dom/test/hydration-private.test.js packages/react-dom/test/react-dom-private-root-bridge-shell.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs | sed -n '1,340p'
sed -n '1,220p' ORCHESTRATOR.md
sed -n '1,260p' WORKER_BRIEF.md
git diff --check
sed -n '3560,4155p' packages/react-dom/src/client/root-bridge.js
sed -n '4155,4435p' packages/react-dom/src/client/root-bridge.js
sed -n '5280,5445p' packages/react-dom/src/client/root-bridge.js
rg -n "TargetClaiming|targetClaiming|TARGET_CLAIMING|privateHydrateRootPublicFacadeTarget" packages/react-dom/src/client/root-bridge.js packages/react-dom/src/client/hydration-boundary-gate.js packages/react-dom/package.json packages/react-dom/index.js packages/react-dom/client.js
sed -n '9060,9205p' packages/react-dom/src/client/root-bridge.js
sed -n '20680,20940p' packages/react-dom/src/client/root-bridge.js
sed -n '724,870p' packages/react-dom/src/client/hydration-boundary-gate.js
sed -n '3180,3335p' packages/react-dom/src/client/root-bridge.js
sed -n '6760,7095p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
sed -n '1170,1348p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
sed -n '3310,3345p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/client/hydration-boundary-gate.js
node --check packages/react-dom/test/hydration-private.test.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test packages/react-dom/test/hydration-private.test.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
npm run check --workspace @fast-react/react-dom
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git add --intent-to-add worker-progress/worker-770-hydrateroot-target-claiming-preflight.md && git diff --check
```

## Verification

- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/test/hydration-private.test.js`: passed.
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed.
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed.
- `node --test packages/react-dom/test/hydration-private.test.js`: passed,
  10 tests.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 62 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed, 29 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 166 package
  tests plus smoke.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git add --intent-to-add worker-progress/worker-770-hydrateroot-target-claiming-preflight.md && git diff --check`:
  passed with this report included.

## Risks Or Blockers

- No blockers remain.
- The new API is intentionally private and source-module/test-facing only. No
  public package exports were added.
- The implementation adds another diagnostic gate layer before real public
  hydration execution. Follow-up work can consume this preflight evidence when
  target claiming moves from diagnostic-only to execution.

## Recommended Next Tasks

- Merge this worker after orchestrator review.
- Use the accepted target-claiming evidence as a prerequisite for a later
  private hydrateRoot replay execution gate.
