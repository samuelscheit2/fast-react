# Worker 370: React DOM Event Listener Invocation Private

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "Extend private React DOM event
  dispatch diagnostics from target path and listener metadata to a controlled
  single-listener invocation canary, keeping SyntheticEvent and public dispatch
  blocked."

## Summary

Extended the private React DOM event plugin diagnostics with an explicit
single-listener invocation canary. Existing event dispatch records still stop
at target resolution, target-to-root listener metadata, plugin extraction
metadata, and blocked dispatch queue records. Installed root listener shells
remain inert: they create and retain dispatch metadata, but do not invoke
callbacks unless a private canary helper is called separately.

The canary invokes exactly one hidden dispatch listener selected from a private
dispatch record, passes a frozen private non-SyntheticEvent canary object,
captures return/error values in WeakMap payloads, and records that public event
dispatch, SyntheticEvent construction, hydration replay, controlled restore,
browser DOM compatibility, and public root behavior remain blocked.

No public `react-dom` or `react-dom/client` exports were changed. No
SyntheticEvent implementation, dispatch queue processing, propagation handling,
browser DOM event compatibility, hydration replay, controlled restore, or
public root event behavior was implemented.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
  - Added private single-listener invocation canary records, canary event
    records, payload accessors, invalid-record guards, and dispatch-record
    selection helpers.
  - Kept dispatch queue records metadata-only while marking the canary as
    available only through private helpers.
- `packages/react-dom/src/events/root-listeners.js`
  - Added private helpers to invoke a canary from the last retained root
    listener dispatch record and inspect the last canary record.
  - Kept installed listener shell return values and default behavior inert.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Added success, thrown-listener, root-listener, invalid-record, and public
    export assertions for the private canary path.
- `worker-progress/worker-370-react-dom-event-listener-invocation-private.md`
  - This report.

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested worker reports 170, 171, 239, 270, 311, and 339.
- Worker 367 did not have a finalized markdown report in this worktree; its
  sibling worktree contained only a Codex log, so conclusions were based on
  the accepted current source plus worker 339's event dispatch baseline.
- Inspected current private event dispatch, dispatch alias, root listener,
  event listener wrapper, component-tree target/listener lookup, and focused
  conformance tests.
- Checked React 19.2.6 reference sources for `DOMPluginEventSystem`,
  `SimpleEventPlugin`, and `getListener`: real React processes dispatch queues
  and creates SyntheticEvents, while this worker intentionally added only an
  explicit private one-listener canary and kept those public paths blocked.
- No nested agents or subagents were used.

## Verification

Passed:

```sh
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/events/root-listeners.js
node --check packages/react-dom/src/events/dispatch.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node tests/smoke/import-entrypoints.mjs
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-370-react-dom-event-listener-invocation-private.md && git diff --check; rc=$?; git reset -- worker-progress/worker-370-react-dom-event-listener-invocation-private.md >/dev/null; exit $rc
```

Results:

- Focused event dispatch skeleton: 13 tests passed.
- Event priority shell: 7 tests passed.
- Root listener installation oracle: 15 tests passed.
- Container listener shell smoke passed.
- Import entrypoint smoke passed.
- React DOM workspace check passed with 26 package tests plus import-entrypoint
  smoke. npm printed the existing `minimum-release-age` warning.
- Report-inclusive `git diff --check` passed after adding this report with
  intent-to-add, then unstaging it.

## Risks Or Blockers

- The canary intentionally invokes private JS listener values. It must remain
  behind private source imports and explicit test/admission helpers.
- The canary event is not a SyntheticEvent and does not expose browser event
  methods such as `preventDefault`, `stopPropagation`, or propagation state.
- Errors are captured on private canary records only; there is no root error
  reporting, global error routing, or public dispatch error behavior.
- Dispatch queue processing, propagation stopping, portal/root retargeting,
  hydration replay, controlled state restore, and public event compatibility
  remain blocked.

## Recommended Next Tasks

1. Add a separate private SyntheticEvent shape gate before any broader dispatch
   queue execution is considered.
2. Add portal and nested-root retargeting diagnostics before canary invocation
   is used across root boundaries.
3. Keep public event dispatch blocked until SyntheticEvent, propagation,
   hydration replay, controlled restore, root error policy, and public root
   behavior all have dedicated evidence.
