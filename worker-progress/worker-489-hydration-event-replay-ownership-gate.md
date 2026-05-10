# Worker 489: Hydration Event Replay Ownership Gate

Date: 2026-05-10

## Goal Tool State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Extend private hydration
  replay diagnostics to prove blocked event targets retain root and dehydrated
  boundary ownership through drain ordering.

## Summary

- Added a private
  `FastReactDomHydrationReplayOwnershipGateDiagnostic` in the hydration
  boundary gate.
- The diagnostic rebuilds blocked replay queue evidence from a private
  hydration boundary record, then compares event-queue entries with drain-order
  entries to prove target path, queue identity, dehydrated root ownership, and
  dehydrated Suspense/Activity boundary owner identity are retained through
  drain ordering.
- Threaded an empty ownership diagnostic through unsupported hydrate-root
  boundary records and replay blockers.
- Kept all behavior diagnostic-only: no public `hydrateRoot`, event queue
  mutation, queue draining, event replay, host hydration, listener install, or
  DOM mutation is enabled or claimed.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-489-hydration-event-replay-ownership-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 401, 433, 458, and 459.
- Inspected current private hydration marker, target-resolution, replay queue,
  drain-order, text mismatch, and unsupported hydrate-root diagnostics.
- Checked pinned React 19.2.6 source for `findInstanceBlockingTarget`,
  continuous/discrete replay queueing, explicit hydration target attempts,
  `replayUnblockedEvents`, and `retryIfBlockedOn`.
- Confirmed the new diagnostic is derived only from existing private boundary
  and event dispatch records and preserves the accepted blocked/no-op flags.

## Commands Run

- `create_goal`
- `get_goal`
- `pwd && rg --files ...`
- `git status --short`
- `sed` / `rg` inspections for required docs, worker reports, hydration/event
  source, focused tests, conformance tests, and React 19.2.6 reference source.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git add --intent-to-add worker-progress/worker-489-hydration-event-replay-ownership-gate.md && git diff --check`
- `git status --short`

## Verification

- JS syntax checks passed for touched JS/MJS files.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 7
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 11 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 60 package tests
  plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add. A first attempt hit a stale worktree `index.lock`; the lock
  was gone on inspection and the rerun passed.

## Risks Or Blockers

- The ownership diagnostic is record-only and compares private diagnostic rows.
  It does not implement real `blockedOn` instance ownership, retry scheduling,
  queue mutation, queue draining, event dispatch, or host hydration.
- Boundary ownership remains marker-derived until reconciler hydration roots,
  dehydrated boundary state, hydratable cursors, and marker consumption exist.
- Public hydration and event replay compatibility remain intentionally
  unclaimed.

## Recommended Next Tasks

- Replace marker-derived ownership rows with real reconciler
  HostRoot/Suspense/Activity blocked-on instances once hydration state exists.
- Add executable replay queue mutation and draining only after target ownership
  can be cleared by real hydration/retry scheduling.
- Keep public `hydrateRoot` blocked until marker consumption, mismatch
  recovery, event replay, and host hydration are admitted together.

## Nested Agents

- None spawned.
