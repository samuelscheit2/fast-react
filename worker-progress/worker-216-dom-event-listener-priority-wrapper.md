# Worker 216 DOM Event Listener Priority Wrapper

## Goal Evidence

- `create_goal` was called before research or file reads for objective:
  "wire the private React DOM root listener shell to deterministic
  event-priority wrapper records for supported discrete/continuous/default
  event names, without SimpleEventPlugin extraction, event dispatch queues, DOM
  node maps, hydration replay, controlled restore, or public root behavior
  changes".
- `get_goal` reported status `active` for that same objective.

## Summary

Wired the private React DOM listener shell through frozen event-priority
wrapper records. The listener function still remains the object passed to
`addEventListener`, preserving existing private shell behavior, but each shell
now points at a deterministic record containing the DOM event name, flags,
target container, selected wrapper kind, lane-backed priority, priority label,
priority name, priority lane, and inert listener function.

The existing private function-returning wrapper APIs remain available and keep
returning inert listener functions. New record-returning helpers provide the
structured boundary that later dispatch/update-priority work can consume
without adding plugin extraction, dispatch queues, DOM node maps, hydration
replay, controlled restore, or public root behavior.

No subagents were spawned.

## Changed Files

- `packages/react-dom/src/events/event-priorities.js`
  - Added frozen event-priority record helpers for mapped or explicitly
    provided lane-backed event priorities.
- `packages/react-dom/src/events/react-dom-event-listener.js`
  - Added frozen event-priority wrapper records and record-returning wrapper
    constructors.
  - Kept existing listener-returning constructors as compatibility shims over
    the record helpers.
- `packages/react-dom/src/events/root-listeners.js`
  - Creates root listener shells from wrapper records and stores the record on
    private non-enumerable listener metadata.
- `tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  - Covers wrapper records for every supported native event name, root listener
    installation records across all registrations, inert callback behavior, and
    unchanged public React DOM exports.
- `tests/smoke/react-dom-container-listener-shell.mjs`
  - Strengthened root listener guard coverage to assert every installed shell
    has the expected frozen wrapper record.
- `worker-progress/worker-216-dom-event-listener-priority-wrapper.md`
  - This report.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 041, 048, 065, 089, 141, 170, and 171.
- Inspected private event files under `packages/react-dom/src/events/**` plus
  root marker/listener guard files.
- Cross-checked local React 19.2.6 source reference for
  `ReactDOMEventListener.createEventListenerWrapperWithPriority` and
  `getEventPriority`.
- Confirmed the root listener shell remains inert: focused tests invoke wrapper
  listeners with native events whose `stopPropagation` would throw if hydration
  replay or blocked dispatch behavior were reached.
- Confirmed public `react-dom` and `react-dom/client` export keys are unchanged
  by the private modules.

## Commands Run

- `pwd && rg --files | rg '(^WORKER_BRIEF.md$|^MASTER_PLAN.md$|^MASTER_PROGRESS.md$|^worker-progress/worker-(041|048|065|089|141|170|171).*)'`
- `rg --files packages/react-dom/src/events packages/react-dom/src | rg '(events/|Root|Listener|Event|priority|Priority)'`
- `git status --short`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,620p' MASTER_PROGRESS.md`
- `sed -n '1,320p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '1,320p' worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `sed -n '1,320p' worker-progress/worker-065-dom-event-delegation-oracle.md`
- `sed -n '1,320p' worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `sed -n '1,320p' worker-progress/worker-141-event-node-map-refresh.md`
- `sed -n '1,320p' worker-progress/worker-170-dom-event-priority-shell.md`
- `sed -n '1,320p' worker-progress/worker-171-dom-root-marker-listener-guard.md`
- `find packages/react-dom/src/events -maxdepth 2 -type f -print | sort`
- `nl -ba packages/react-dom/src/events/event-priorities.js | sed -n '1,320p'`
- `nl -ba packages/react-dom/src/events/react-dom-event-listener.js | sed -n '1,320p'`
- `nl -ba packages/react-dom/src/events/root-listeners.js | sed -n '1,420p'`
- `nl -ba packages/react-dom/src/events/event-names.js | sed -n '1,320p'`
- `nl -ba packages/react-dom/src/events/listener-registry.js | sed -n '1,360p'`
- `nl -ba packages/react-dom/src/client/root-markers.js | sed -n '1,360p'`
- `nl -ba packages/react-dom/src/client/dom-container.js | sed -n '1,320p'`
- `rg -n "EventPriority|createEventListenerWrapper|root-listener|listener shell|react-dom-event-listener|listenToNativeEvent|listenToAllSupportedEvents|__FAST_REACT_DOM_EVENT" tests packages/react-dom -g '*.mjs' -g '*.js'`
- `nl -ba tests/conformance/test/react-dom-event-priority-shell.test.mjs | sed -n '1,280p'`
- `nl -ba tests/smoke/react-dom-container-listener-shell.mjs | sed -n '1,760p'`
- `cat package.json`
- `cat packages/react-dom/package.json`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | sed -n '1,430p'`
- Event-priority oracle summary checks with `node --input-type=module`.
- `node --check packages/react-dom/src/events/event-priorities.js`
- `node --check packages/react-dom/src/events/react-dom-event-listener.js`
- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check tests/smoke/react-dom-container-listener-shell.mjs`
- `node --check tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `npm run check:js`
- `git diff --check`
- `git add --intent-to-add worker-progress/worker-216-dom-event-listener-priority-wrapper.md && git diff --check && git reset -- worker-progress/worker-216-dom-event-listener-priority-wrapper.md`

## Verification

- `node --check` passed for touched React DOM event JS files and focused test
  files.
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  passed 7 tests.
- `node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
  passed 10 tests.
- `node tests/smoke/react-dom-container-listener-shell.mjs` passed.
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
  passed 15 tests.
- `npm run check:js` passed, including package-surface, smoke entrypoint,
  benchmark, workspace JS checks, native loader checks, and 482 conformance
  tests.
- `git diff --check` passed, including a second run with the new report added
  via `git add --intent-to-add`.

## Risks Or Blockers

- This remains an inert private listener shell. It does not set current update
  priority, dispatch plugin events, build dispatch queues, consult DOM node
  maps, replay hydration events, or restore controlled state.
- `message` remains covered by direct private wrapper creation with injected
  Scheduler priority. Root listener installation does not support a native
  `message` listener because it is not in the current supported native event
  list.
- Later real dispatch work should preserve the record shape or deliberately
  migrate it when adding update-priority state.

## Recommended Next Tasks

- Add private DOM update-priority state only when a reconciler lane/update
  boundary is ready to consume it.
- Keep SimpleEventPlugin extraction and user callback dispatch blocked on
  committed DOM node maps, latest props, mounted host-token validation, and
  dispatch queue processing.
