# Worker 244: DOM Event Dispatch Plugin Skeleton

## Goal

- Status: active
- Objective: add a private React DOM event dispatch/plugin extraction skeleton
  that accepts existing listener wrapper metadata and produces deterministic
  fail-closed dispatch records, without invoking user listeners, bubbling
  through component trees, hydration replay, controlled restore, public root
  behavior, or compatibility claims.
- Goal tool: `create_goal` and `get_goal` were available. `get_goal` confirmed
  the active objective above before source inspection and again before this
  report.

## Summary

Added a private React DOM event dispatch/plugin extraction skeleton under
`packages/react-dom/src/events`.

The skeleton:

- Accepts existing frozen listener wrapper records, or listener functions that
  carry `__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__`.
- Produces frozen dispatch records and plugin-extraction records with explicit
  blocked status, empty dispatch queue, zero synthetic events, and zero listener
  invocations.
- Normalizes native event targets for `target`, `srcElement`, SVG
  `correspondingUseElement`, text-node parent targets, and no-target fallback.
- Records event-system flag state and private priority wrapper metadata.
- Keeps hydration replay, target-instance resolution, controlled state restore,
  public root behavior, and plugin extraction blocked.
- Keeps installed root listener callbacks returning `undefined`, preserving the
  accepted inert shell behavior.

No public React DOM entrypoint, root listener installation count, component-tree
map API, hydration replay path, controlled restore path, synthetic event
constructor, dispatch queue processor, or user callback invocation was enabled.

## Changed Files

- `packages/react-dom/src/events/event-system-flags.js`
  - Adds private React DOM event-system flag constants and pure flag predicates.
- `packages/react-dom/src/events/get-event-target.js`
  - Adds private record-only native event target normalization.
- `packages/react-dom/src/events/plugin-event-system.js`
  - Adds frozen fail-closed dispatch records, plugin-extraction records, empty
    dispatch queue records, blocked hydration/controlled-restore records, and
    wrapper-record validation.
- `packages/react-dom/src/events/react-dom-event-listener.js`
  - Routes private dispatcher entry points through the new record builder while
    discarding records from installed listener callbacks so callbacks remain
    inert.
- `packages/react-dom/src/events/root-listeners.js`
  - Consumes shared private event-system flag constants without changing
    listener installation behavior.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Adds focused conformance coverage for fail-closed record shape, target
    normalization, blocked plugin extraction, invalid wrapper metadata, inert
    installed listeners, and unchanged public React DOM exports.
- `worker-progress/worker-244-dom-event-dispatch-plugin-skeleton.md`
  - This report.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 048, 065, 098, 141, 168, 170, 171, 214, and 216 for
  event-priority, event-delegation, plugin-extraction, component-tree, root
  listener, and wrapper-record boundaries.
- Inspected local private event files under `packages/react-dom/src/events/*`
  and the stable component-tree map surface without wiring it into dispatch.
- Inspected React 19.2.6 reference source:
  `ReactDOMEventListener.js`, `DOMPluginEventSystem.js`,
  `EventSystemFlags.js`, `getEventTarget.js`, `getListener.js`, and
  `plugins/SimpleEventPlugin.js`.
- Inspected focused local event/root listener tests and the delegation/root
  listener oracle tests.
- Spawned two read-only explorer agents for reference-source and local-test
  constraint checks. They did not return usable findings before timeout, were
  closed, and did not affect implementation conclusions.

## Commands Run

- `pwd && rg --files ...`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `sed -n '1,320p' worker-progress/worker-065-dom-event-delegation-oracle.md`
- `sed -n '1,300p' worker-progress/worker-170-dom-event-priority-shell.md`
- `sed -n '1,300p' worker-progress/worker-171-dom-root-marker-listener-guard.md`
- `sed -n '1,300p' worker-progress/worker-216-dom-event-listener-priority-wrapper.md`
- `sed -n '1,260p' worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `nl -ba packages/react-dom/src/events/event-priorities.js | sed -n '1,360p'`
- `nl -ba packages/react-dom/src/events/react-dom-event-listener.js | sed -n '1,360p'`
- `nl -ba packages/react-dom/src/events/root-listeners.js | sed -n '1,460p'`
- `nl -ba packages/react-dom/src/events/listener-registry.js | sed -n '1,420p'`
- `nl -ba packages/react-dom/src/events/event-names.js | sed -n '1,360p'`
- `nl -ba packages/react-dom/src/client/component-tree.js | sed -n '1,420p'`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | sed -n '1,460p'`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js | sed -n '1,780p'`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/EventSystemFlags.js | sed -n '1,220p'`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/getEventTarget.js | sed -n '1,220p'`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/getListener.js | sed -n '1,260p'`
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/plugins/SimpleEventPlugin.js | sed -n '1,620p'`
- `node --check packages/react-dom/src/events/event-system-flags.js && node --check packages/react-dom/src/events/get-event-target.js && node --check packages/react-dom/src/events/plugin-event-system.js && node --check packages/react-dom/src/events/react-dom-event-listener.js && node --check packages/react-dom/src/events/root-listeners.js && node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `git diff --check`
- `npm run check:js` first run failed on controlled/form source-token gates
  because the skeleton used literal controlled plugin names.
- `rg -n "ChangeEventPlugin|BeforeInputEventPlugin|SelectEventPlugin" packages/react-dom/src tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - No matches after the fix; `rg` exited 1 as expected for no matches.
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `npm run check:js`
- `git add --intent-to-add ... && git diff --check && git diff --stat && git reset -- ...`
- `git status --short`

## Verification

- `node --check` passed for all touched JS/MJS files.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  passed 6 tests.
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  passed 7 tests.
- `node tests/smoke/react-dom-container-listener-shell.mjs` passed.
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
  passed 15 tests.
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
  passed 10 tests.
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  passed 5 tests after removing disallowed controlled-plugin source tokens.
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  passed 12 tests after removing disallowed controlled-plugin source tokens.
- `npm run check:js` passed, including package-surface guard, smoke
  entrypoints, benchmark gate, workspace JS checks, native loader checks, and
  conformance with 511 passing tests.
- `git diff --check` passed with new files included through
  `git add --intent-to-add`.

## Risks Or Blockers

- The skeleton intentionally does not implement actual plugin extraction,
  synthetic events, propagation, target-instance resolution, root/portal
  retargeting, hydration replay, controlled restore, event batching, update
  priority state, or user callback invocation.
- Plugin labels in the private records use gate-safe descriptive ids such as
  `change-event-plugin` rather than the exact React source token names, because
  existing unsupported controlled-form gates forbid those source tokens until
  real controlled event adapters are admitted.
- The dispatch records retain references to private wrapper records and target
  containers for internal inspection; they are deterministic internal records,
  not public serializable artifacts or compatibility claims.
- Worker 259 may update component-tree maps. This worker did not consume or
  modify those APIs, so later event work still needs to integrate with the
  stable mounted-token/latest-props boundary deliberately.

## Recommended Next Tasks

1. Add a private DOM update-priority state gate only when a reconciler lane
   boundary is ready to consume event priority during dispatch.
2. Add target-instance resolution against stable mounted host-token APIs before
   plugin extraction can find listeners.
3. Add a later `SimpleEventPlugin` extraction slice that builds dispatch queue
   entries without invoking callbacks, then separately gate dispatch queue
   processing.
4. Keep hydration replay, portal retargeting, controlled state restore, and
   public root listener behavior in separate follow-up slices with their own
   fail-closed tests.
