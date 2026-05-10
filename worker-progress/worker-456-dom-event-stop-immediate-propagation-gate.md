# Worker 456: DOM Event Stop-Immediate-Propagation Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "Add private event diagnostics for
  stopPropagation and native stopImmediatePropagation interactions across
  same-target and ancestor listener queues."

## Summary

Added private React DOM event diagnostics for listener queue propagation gates.
The private listener registry can now attach diagnostic-only listener queue
entries to mounted host nodes without installing DOM listeners. The event plugin
metadata path folds those private queue entries into dispatch listener records,
which lets focused tests model multiple same-target listeners and ancestors.

The dispatch-queue canary now distinguishes React-style `stopPropagation()`
from native `stopImmediatePropagation()` diagnostics. `stopPropagation()`
preserves same-target queued listeners and skips the first different target
queue. Opt-in native `stopImmediatePropagation()` diagnostics expose the native
event only to the private canary event, record native call counts, and skip
later same-target and ancestor queue entries. Public dispatch, SyntheticEvent
dispatch, browser DOM event compatibility, and public root behavior remain
blocked.

## Changed Files

- `packages/react-dom/src/events/listener-registry.js`
  - Added diagnostic-only private listener queue entry records with hidden
    listener payloads and removal helpers.
- `packages/react-dom/src/events/plugin-event-system.js`
  - Accumulates private listener queue entries into dispatch listener metadata.
  - Added opt-in native `stopImmediatePropagation()` diagnostic state, records,
    aggregate counts, invocation metadata, and canary-event native access.
  - Extended propagation-stop diagnostic rows with same-target/ancestor
    relation metadata.
- `packages/react-dom/src/events/root-listeners.js`
  - Threads the native stop-immediate diagnostic option through the private
    root host-output click canary and fake click event.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Added same-target `stopPropagation()` coverage.
  - Added native `stopImmediatePropagation()` coverage for same-target and
    ancestor skipped queues.
- `worker-progress/worker-456-dom-event-stop-immediate-propagation-gate.md`
  - This report.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and available worker reports 170, 370, 397, 429, and
  430. Worker 455 was not present in this worktree.
- Inspected current private event dispatch, root listener, listener registry,
  SyntheticEvent shape, propagation/error diagnostic, and root-output click
  canary code.
- Checked React 19.2.6 reference source:
  `DOMPluginEventSystem.processDispatchQueueItemsInOrder` skips only when
  `event.isPropagationStopped()` is true and the next listener belongs to a
  different instance, while `SyntheticEvent.stopPropagation()` routes to
  `nativeEvent.stopPropagation()`. The reference synthetic dispatch loop does
  not separately consult `nativeEvent.stopImmediatePropagation()`.
- Spawned two read-only explorer agents for local event-system context and
  React reference behavior. Neither returned findings before implementation was
  complete; both were closed and did not affect conclusions.

## Verification

Passed:

```sh
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/events/listener-registry.js
node --check packages/react-dom/src/events/root-listeners.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
```

Results:

- Focused event dispatch skeleton passed: 19 tests.
- Event priority shell passed: 7 tests.
- Root listener installation oracle passed: 15 tests.
- Container listener shell smoke passed.
- Private root bridge package test passed: 26 tests.
- DOM event delegation oracle passed: 10 tests.
- React DOM workspace check passed: 53 package tests plus import-entrypoint
  smoke. npm printed the existing `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- The private listener queue registry is diagnostic-only and does not call
  `addEventListener`, dispatch browser events, or expose public package
  surface.
- Native `stopImmediatePropagation()` is modeled as an opt-in private
  diagnostic gate over the canary listener queue. It is not a browser event
  compatibility claim and does not enable public dispatch.
- SyntheticEvent dispatch, hydration replay, controlled restore, portal
  retargeting, and root error reporting remain blocked.

## Recommended Next Tasks

- Add portal/nested-root retargeting diagnostics before using these queue gates
  across root boundaries.
- Keep public event compatibility blocked until SyntheticEvent dispatch,
  hydration replay, controlled restore, root error policy, and browser event
  behavior are admitted together.
