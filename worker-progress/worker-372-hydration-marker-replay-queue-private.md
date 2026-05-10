# Worker 372: Hydration Marker Replay Queue Private

## Goal Tool State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Add private hydration marker
  replay-queue diagnostics tied to root bridge marker/listener state,
  preserving fail-closed public `hydrateRoot` and event replay behavior.

## Summary

- Added private, frozen hydration marker replay-queue diagnostics to unsupported
  hydration boundary records.
- Threaded those diagnostics through private root bridge `hydrateRoot` records
  and root bridge admission records.
- Tied the replay-queue diagnostics to the existing marker and listener guard
  snapshots, including whether the container is marked as a root and whether
  root/owner-document listening markers are present.
- Kept every replay queue fail-closed: no explicit hydration targets, continuous
  event queues, discrete events, change targets, form actions, scheduled replay
  attempts, dispatch, hydration, DOM mutation, listener installation, or public
  root creation is enabled.
- Refreshed focused hydration/root bridge tests and added an oracle assertion
  that replay queue evidence remains diagnostic-only.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `worker-progress/worker-372-hydration-marker-replay-queue-private.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 169, 244, 272, 314, 341, and 352.
- Worker report 367 was requested if present, but no matching progress report
  file exists in this checkout.
- Inspected the current hydration boundary gate, marker parser, root bridge,
  root marker, listener registry, root listener, and event dispatch blocker
  code.
- Checked React 19.2.6 source
  `ReactDOMEventReplaying.js` for replay queue names:
  `queuedExplicitHydrationTargets`, `queuedFocus`, `queuedDrag`,
  `queuedMouse`, `queuedPointers`, `queuedPointerCaptures`,
  `queuedChangeEventTargets`, and `$$reactFormReplay`.
- Confirmed the existing public `react-dom/client.hydrateRoot` remains an
  unsupported placeholder and private event dispatch still records blocked
  hydration replay.

## Commands Run

- `create_goal`
- `get_goal`
- `rg --files ...`
- `git status --short`
- `sed -n ... WORKER_BRIEF.md`
- `sed -n ... MASTER_PLAN.md`
- `sed -n ... MASTER_PROGRESS.md`
- `sed -n ... worker-progress/worker-169-hydration-boundary-skeleton.md`
- `sed -n ... worker-progress/worker-244-dom-event-dispatch-plugin-skeleton.md`
- `sed -n ... worker-progress/worker-272-dom-host-text-commit-to-mutation-adapter.md`
- `sed -n ... worker-progress/worker-314-hydration-marker-parser-root-bridge-integration.md`
- `sed -n ... worker-progress/worker-341-hydration-marker-root-bridge-replay-boundary.md`
- `sed -n ... worker-progress/worker-352-root-render-e2e-private-admissions-after-host-output.md`
- `sed -n ... worker-progress/worker-367-react-dom-root-private-initial-render-host-output.md`
  failed because that report is not present.
- `nl -ba ...` and `rg -n ...` source/test inspections across the assigned
  hydration/root bridge/event files and React 19.2.6 reference source.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/hydration-marker-parser.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --check tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
- `git diff --check --no-index /dev/null worker-progress/worker-372-hydration-marker-replay-queue-private.md`
- `git add --intent-to-add worker-progress/worker-372-hydration-marker-replay-queue-private.md`
- `git diff --check`
- `git reset -- worker-progress/worker-372-hydration-marker-replay-queue-private.md`

## Verification

- JS syntax checks passed for all touched JS/MJS files and the assigned marker
  parser file.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 3
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 7 tests.
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`:
  passed, 9 tests.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 8 tests.
- Root marker, root listener, and public facade spot checks passed.
- `npm run check --workspace @fast-react/react-dom`: passed, 26 package tests
  plus entrypoint smoke. npm emitted the existing `minimum-release-age` warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- The new replay-queue records are diagnostic metadata only. They do not queue
  hydration targets, replay events, schedule hydration, dispatch events, invoke
  listeners, mutate DOM, or create public hydration roots.
- Replay target candidates are derived from accepted marker rows and remain
  non-eligible until real dehydrated HostRoot/Suspense/Activity ownership and
  event target resolution exist.
- Future event replay implementation should replace these zero-count private
  diagnostics only after root marker/listener ownership, target resolution, and
  queue draining have explicit executable boundaries.

## Recommended Next Tasks

- Add real hydration replay queues only after dehydrated root/boundary ownership
  and target resolution are available.
- Keep public `hydrateRoot` blocked until hydration root construction, marker
  consumption, scheduling, recoverable mismatch handling, and event replay are
  implemented together.
- If worker 367 later lands a progress report that changes root bridge
  terminology, reconcile these diagnostics with that accepted wording.

## Nested Agents

- None spawned.
