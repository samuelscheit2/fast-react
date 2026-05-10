# Worker 455: DOM Event currentTarget Bubbling Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "extend private event dispatch
  diagnostics so capture/bubble listeners observe React-shaped currentTarget
  progression and post-dispatch reset on fake DOM nodes".

## Summary

Extended the private React DOM dispatch-queue invocation canary so the canary
event for each dispatch entry has React-style `currentTarget` progression:
the queue canary sets `currentTarget` before each listener, resets it to
`null` immediately after listener return/error capture, and records the
before/during/after diagnostic rows.

The installed root listener shells remain inert, no browser listeners were
added, no real DOM events are dispatched, no public React DOM exports changed,
and public event compatibility remains blocked.

No nested agents or subagents were used.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
  - Creates dispatch-entry canary event contexts even without propagation-stop
    diagnostics.
  - Tracks private `currentTarget` before/during/after listener invocation and
    resets it after each canary listener.
  - Adds queue-level current-target progression/reset diagnostics while
    preserving private-only listener invocation and blocked public dispatch.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Adds a two-node fake-DOM capture/bubble canary proving parent-to-child
    capture order, child-to-parent bubble order, target identity, shared
    dispatch-entry event objects, and post-dispatch `currentTarget` reset.
  - Extends root host-output click canary assertions to check the underlying
    queue current-target reset diagnostics.
- `worker-progress/worker-455-dom-event-current-target-bubbling-gate.md`
  - This report.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested worker reports for 170, 370, 397, 429, and 430.
- Inspected current private event dispatch, listener wrapper, root listener,
  component-tree dispatch path, and root-output tests.
- Checked React 19.2.6 reference source for `DOMPluginEventSystem`:
  `executeDispatch` sets `event.currentTarget`, invokes the listener, and
  resets it to `null`; capture processing walks root-to-target while bubble
  processing walks target-to-root.

## Verification

Passed:

```sh
node --check packages/react-dom/src/events/dispatch.js
node --check packages/react-dom/src/events/react-dom-event-listener.js
node --check packages/react-dom/src/events/plugin-event-system.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-455-dom-event-current-target-bubbling-gate.md && git diff --check; rc=$?; git reset -- worker-progress/worker-455-dom-event-current-target-bubbling-gate.md >/dev/null; exit $rc
```

Results:

- Focused event dispatch skeleton passed: 18 tests.
- Event priority shell passed: 7 tests.
- Event priority oracle passed: 10 tests.
- Root listener installation oracle passed: 15 tests.
- DOM event delegation oracle passed: 10 tests.
- Container listener shell smoke passed.
- React DOM workspace check passed: 53 package tests plus import-entrypoint
  smoke. npm printed the existing `minimum-release-age` warning.
- `git diff --check` passed with this progress report included via
  intent-to-add; the report was unstaged afterward.

## Risks Or Blockers

- No blockers.
- This is still a private diagnostic canary. It does not install browser
  listeners, dispatch real DOM events, create public SyntheticEvents, route
  public errors, replay hydration events, restore controlled state, or claim
  public event compatibility.
- The canary event remains private and frozen; the diagnostic models React's
  observable `currentTarget` progression/reset through controlled state rather
  than by exposing a public SyntheticEvent.

## Recommended Next Tasks

- Keep propagation-stop, listener-error, portal/nested-root, hydration replay,
  and controlled-restore behavior behind separate private gates.
- Add a future public compatibility gate only after SyntheticEvent dispatch,
  root ownership, hydration replay, and controlled state restore are admitted
  together.
