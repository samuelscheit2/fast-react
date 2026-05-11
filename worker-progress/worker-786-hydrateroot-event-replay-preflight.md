# Worker 786: hydrateRoot Event Replay Preflight

Date: 2026-05-11

## Goal Evidence

- Active goal inspected with `get_goal` before file reads or edits.
- Work ran in the assigned worktree:
  `/Users/user/Developer/Developer/fast-react-worker-786-hydrateroot-event-replay-preflight`.
- Branch confirmed as `worker/786-hydrateroot-event-replay-preflight`.
- Scope stayed limited to the assigned hydration boundary gate, root bridge,
  focused hydration/root facade tests, conformance coverage, and this report.

## Summary

Added the next private `hydrateRoot` event replay preflight behind the
symbol-only `react-dom/client.hydrateRoot` private facade. The new preflight
requires accepted hydrateRoot marker/listener and target-claiming preflight
records, validates the canonical blocked replay target-dispatch execution
metadata from the hydration boundary gate, and records one private event replay
preflight row.

The path remains record-only. It does not dispatch events, install listeners,
mutate DOM, drain replay queues, hydrate host instances, schedule roots, invoke
recoverable-error callbacks, create synthetic events, or claim public
hydrateRoot/event compatibility.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-private.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-786-hydrateroot-event-replay-preflight.md`

## Evidence Gathered

- Added
  `assertCanonicalPrivateHydrationClaimedReplayTargetDispatchExecutionRecord`
  so root-bridge can reject cloned or tampered replay execution metadata with
  the existing private execution error code.
- Added a private hydrateRoot event replay preflight record type, status,
  accepted/blocked capability rows, WeakMap payload, payload accessor, type
  guard, and preflight collection on the private hydrateRoot facade object.
- The event replay preflight requires the accepted private target-claiming
  preflight for the same preflight object and verifies marker/listener state is
  unchanged before and after metadata validation.
- Tests cover the canonical preflight, cloned/raw/foreign target-claiming
  rejection, stale marker/listener state rejection, tampered replay metadata
  rejection, public blocker fields remaining false, and public `hydrateRoot`
  still throwing the unsupported placeholder error.
- No nested agents were spawned.

## Commands Run

```sh
pwd && ls
sed -n '1,240p' WORKER_BRIEF.md
git status --short --branch
sed -n ... packages/react-dom/src/client/hydration-boundary-gate.js
sed -n ... packages/react-dom/src/client/root-bridge.js
rg -n "hydrateRoot|targetClaiming|event replay|replay" packages/react-dom tests packages
sed -n ... worker-progress/worker-770-hydrateroot-target-claiming-preflight.md
sed -n ... worker-progress/worker-583-hydration-replay-target-dispatch-link.md
sed -n ... worker-progress/worker-648-hydration-claim-then-replay-execution.md
sed -n ... worker-progress/worker-678-dom-hydration-replay-click-dispatch.md
node --check packages/react-dom/src/client/hydration-boundary-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/hydration-private.test.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test packages/react-dom/test/hydration-private.test.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
npm run check --workspace @fast-react/react-dom
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
git status --short --branch
git diff --stat
```

## Verification

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/test/hydration-private.test.js`: passed.
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed.
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed.
- `node --test packages/react-dom/test/hydration-private.test.js`: passed,
  10 tests.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 64 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed, 30 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 171 package
  tests plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git diff --check`: passed with this report included.

## Risks Or Blockers

- No blockers remain.
- The new API is private and source/test-facing only. Public package entrypoints
  remain unchanged and blocked for `hydrateRoot`.
- This is still a preflight. Real public hydration and browser event replay
  require later reconciler hydration, queue draining, dispatch, and callback
  integration work.

## Recommended Next Tasks

- Merge after orchestrator review.
- Use this accepted event replay preflight evidence as a prerequisite for any
  future real hydration replay execution gate.
