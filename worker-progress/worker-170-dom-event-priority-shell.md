Worker 170 DOM Event Priority Shell

Goal status at setup: active
Goal objective: add private DOM event priority wrappers and tests around existing event-priority oracle behavior without wiring event plugin extraction or dispatching real events
Goal tool: create_goal and get_goal were available; get_goal confirmed the active goal above.

## Summary

Implemented a private React DOM event-priority shell around the existing
React DOM 19.2.6 oracle evidence. The new code models lane-backed internal
event priorities, DOM event-name buckets, and the `message` Scheduler-priority
bridge without adding public exports, plugin extraction, real event dispatch,
or reconciler priority state.

Root listener shell installation still installs the same listener counts and
options. The installed callbacks are now priority-selected inert wrappers that
return `undefined` and expose private metadata for tests.

No subagents were spawned.

## Changed Files

- `packages/react-dom/src/events/event-priorities.js`
  - Adds private lane-backed event-priority constants matching the checked
    React DOM oracle.
  - Adds discrete and continuous DOM event-name sets, default fallback mapping,
    `message` Scheduler-priority mapping, and identity `eventPriorityToLane`.
- `packages/react-dom/src/events/react-dom-event-listener.js`
  - Adds private inert listener wrappers for discrete, continuous, and default
    entry points.
  - Keeps every callback deterministic and non-dispatching.
- `packages/react-dom/src/events/root-listeners.js`
  - Uses the private priority wrapper when creating listener shells while
    preserving existing root-listener metadata and installation behavior.
- `tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  - Asserts the private mapping matches the checked event-priority oracle.
  - Asserts the `message` Scheduler bridge cases, wrapper metadata, inert
    callback behavior, and unchanged public React DOM/root-client exports.
- `worker-progress/worker-170-dom-event-priority-shell.md`
  - Records goal setup, implementation notes, evidence, and verification.

## Evidence Gathered

- Read `WORKER_BRIEF.md` and prior reports from workers 041, 048, and 141.
- Inspected existing private React DOM listener shell modules:
  `root-listeners.js`, `event-names.js`, `listener-registry.js`, and
  `root-markers.js`.
- Inspected checked conformance oracle helpers and tests for React DOM event
  priority and public export behavior.
- Cross-checked React 19.2.6 source reference for
  `ReactDOMEventListener.getEventPriority`,
  `createEventListenerWrapperWithPriority`, and lane-backed
  `ReactEventPriorities`.
- Verified local package resolution does not expose `scheduler` as a root
  require in this workspace, so the private `message` mapping uses deterministic
  injected Scheduler-priority values with a Normal/default fallback.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,240p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '1,240p' worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `sed -n '1,240p' worker-progress/worker-141-event-node-map-refresh.md`
- `git status --short`
- `rg --files packages/react-dom | sort`
- `rg --files tests/conformance/src tests/conformance/test tests/smoke | sort | rg 'react-dom-event-priority|root-listener|container-listener|react-dom-export|root-markers'`
- `sed -n '1,260p' packages/react-dom/src/events/root-listeners.js`
- `sed -n '1,260p' packages/react-dom/src/events/event-names.js`
- `sed -n '1,260p' packages/react-dom/src/events/listener-registry.js`
- `sed -n '1,260p' packages/react-dom/src/client/root-markers.js`
- `sed -n '1,220p' packages/react-dom/package.json`
- `sed -n '1,240p' packages/react-dom/index.js`
- `sed -n '1,320p' tests/smoke/react-dom-container-listener-shell.mjs`
- `sed -n '1,260p' tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-event-priority-scenarios.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-event-priority-oracle.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-export-oracle.mjs`
- `sed -n '1,260p' tests/conformance/test/react-dom-export-oracle.test.mjs`
- `node -e "console.log(require.resolve('scheduler'))"` (failed as expected:
  no root-level package resolution)
- `sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
- `sed -n '1,220p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js`
- `sed -n '1,200p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactEventPriorities.js`
- `rg "function getEventPriority" -n /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `npm run check:js`
- `git diff --check`

## Verification

- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  - 5 tests passed.
- `node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
  - 10 tests passed.
- `node tests/smoke/react-dom-container-listener-shell.mjs`
  - Passed.
- `npm run check:js`
  - Passed. This included all workspace JS checks and the conformance suite
    with 420 passing tests.
- `git diff --check`
  - Passed.

## Risks Or Blockers

- This intentionally does not implement `ReactDOMUpdatePriority`, controlled
  restore, hydration replay, plugin extraction, or real user callback dispatch.
- `message` event priority can be tested deterministically through injected
  Scheduler-priority values. A later real Scheduler integration should replace
  the fallback when DOM event dispatch is wired to the reconciler.
- The event-name arrays mirror the checked oracle. Future React version updates
  should regenerate or update the oracle before changing these private maps.

## Recommended Next Tasks

- Add a private DOM update-priority module only when there is a reconciler lane
  boundary ready to consume it.
- Keep plugin extraction and user callback dispatch blocked on committed DOM
  node maps/latest-props lookup and mounted host-token validation.
- When real dispatch exists, preserve the current public export tests so these
  private internals stay package-private.
