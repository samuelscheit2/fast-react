# Worker 430: React DOM Event Propagation/Error Diagnostics

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "Add private diagnostics for
  propagation stop and listener error routing in root-output event invocation
  canaries while keeping public event dispatch blocked."

## Summary

Added opt-in private diagnostics to the React DOM root-output click invocation
canary. The default private canary path remains unchanged: installed root
listeners stay inert, public dispatch stays blocked, and the default canary
event still does not expose SyntheticEvent propagation methods.

When requested through private options, the dispatch-queue canary now records
propagation stop routing, routes `stopPropagation()` to the fake native event,
skips later listener records with React-style stopped-propagation checks, and
emits propagation diagnostic rows. It also records listener error routing rows
for captured listener errors as blocked `reportGlobalError` diagnostics without
reporting globally or exposing the error on public record fields.

No nested agents were spawned.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
  - Added private propagation-stop diagnostic records, opt-in canary event
    `stopPropagation` / `isPropagationStopped` support, and stopped-listener
    skip metadata.
  - Added private listener-error route records with hidden error payloads and
    blocked `reportGlobalError` routing metadata.
- `packages/react-dom/src/events/root-listeners.js`
  - Threaded opt-in diagnostic options through the private root-output click
    canary and surfaced aggregate propagation/error route counts.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Added root-output click canary coverage for capture-phase
    `stopPropagation` skipping bubble invocation.
  - Added root-output click canary coverage for listener error route metadata
    while later listeners still run.
- `worker-progress/worker-430-react-dom-event-propagation-error-diagnostics.md`
  - This report.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read available requested reports for workers 170, 339, 370, 397, and 401.
  Worker 429's markdown report was not present in this worktree.
- Inspected current private event dispatch, root listener, component-tree, and
  root bridge host-output code.
- Checked React 19.2.6 source for `DOMPluginEventSystem` dispatch-queue
  propagation checks and listener error routing through `reportGlobalError`,
  plus `SyntheticEvent.stopPropagation` routing to the native event.

## Verification

Passed:

```sh
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/events/root-listeners.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
git diff --check
```

Observed unrelated failure while widening coverage:

```sh
node tests/smoke/react-dom-component-tree-map-shell.mjs
```

failed at `tests/smoke/react-dom-component-tree-map-shell.mjs:611` because
`domHost.createLatestPropsCommitRecord` did not throw the expected
`FAST_REACT_DOM_UNSAFE_LATEST_PROPS_PAYLOAD_RECORD`. This is outside this
worker's touched files and write scope; the required React DOM workspace check
does not run that smoke and passed.

`git diff --check` passed with this report included via intent-to-add, then the
report was unstaged again.

## Risks Or Blockers

- The propagation methods are intentionally opt-in for private canary
  diagnostics. Default canary events still do not expose SyntheticEvent shape
  fields.
- Listener error routing is record-only. It does not call `reportGlobalError`,
  invoke root error callbacks, throw to callers, or enable public dispatch.
- The root-output canary still uses the single-host fake-DOM output currently
  admitted by `root-bridge.js`; broader ancestor propagation remains blocked
  on richer host-output trees or future root commit output.

## Recommended Next Tasks

- Add portal/nested-root retargeting diagnostics before using this canary
  across root boundaries.
- Revisit full SyntheticEvent shape only when public dispatch, hydration
  replay, and controlled restore are admitted together.
- Assign an out-of-scope follow-up for the component-tree smoke failure if it
  is not already covered by another worker.
