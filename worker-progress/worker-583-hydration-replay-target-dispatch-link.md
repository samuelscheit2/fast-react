# Worker 583: Hydration Replay Target Dispatch Link

## Goal Tool State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal objective from `get_goal`: Connect hydration replay
  target-resolution diagnostics to private event dispatch path metadata while
  replay and dispatch remain blocked.
- Active goal status from `get_goal`: active.

## Summary

- Added a private
  `FastReactDomHydrationReplayTargetDispatchLinkDiagnostic` in the React DOM
  plugin event system.
- The diagnostic links one blocked replay queue candidate to its hydratable
  target lookup, retained dehydrated boundary owner, exact private event target
  dispatch path record, and blocked dispatch metadata.
- Added identity guards for stale replay queue entries, dispatch records that
  did not produce the selected queue entry, missing dehydrated boundary
  ownership, stale target lookup metadata, and foreign dispatch path records.
- Exposed a hydration-boundary wrapper that rebuilds the queue diagnostic from
  a private hydration boundary record and dispatch record while keeping replay,
  dispatch, hydration mutation, queue draining, and public compatibility
  blocked.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-private.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-583-hydration-replay-target-dispatch-link.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Reviewed accepted hydration target-resolution, replay queue drain-order,
  ownership gate, and resource/form boundary refresh reports.
- Inspected current private event dispatch records, event target dispatch path
  records, hydration replay queue diagnostics, target-resolution diagnostics,
  ownership gate diagnostics, hydration boundary tests, and delegation oracle
  conformance tests.
- Checked pinned React 19.2.6 reference source for
  `findInstanceBlockingTarget`, blocked-on container/Suspense/Activity returns,
  continuous replay queues, explicit hydration targets, and replay drain
  scheduling.

## Commands Run

- `create_goal`
- `get_goal`
- `pwd && rg --files ...`
- `git status --short --branch`
- `sed` / `rg` inspections for worker docs, prior reports, hydration/event
  source, tests, package scripts, and React reference source.
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --check tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git add --intent-to-add packages/react-dom/test/hydration-private.test.js worker-progress/worker-583-hydration-replay-target-dispatch-link.md && git diff --check`

## Verification Results

- `node --test packages/react-dom/test/hydration-private.test.js`: passed, 3
  tests.
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`:
  passed, 13 tests.
- Existing hydration ordering coverage:
  `node --test packages/react-dom/test/hydration-boundary.test.js` passed, 8
  tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 96 package tests
  plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed with new files included via intent-to-add.

## Risks Or Blockers

- No blockers remain.
- The link diagnostic is record-only and identity-checked. It does not queue,
  drain, replay, dispatch, hydrate, mutate DOM, invoke callbacks, or claim
  browser compatibility.
- Boundary ownership remains marker-derived until real reconciler hydration
  root and dehydrated boundary state are implemented.

## Recommended Next Tasks

- Replace marker-derived boundary ownership with real HostRoot/Suspense/Activity
  blocked-on instances when hydration state exists.
- Admit replay queue mutation and draining only after target ownership can be
  cleared by real hydration retry scheduling.
- Keep public `hydrateRoot` and event replay compatibility blocked until
  dispatch, hydration, and error recovery are covered end to end.

## Nested Agents

- None spawned.
