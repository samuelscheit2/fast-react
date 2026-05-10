# Worker 434: Portal preparePortalMount Listener Gate

## Goal State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Worker 434: add a private
  preparePortalMount listener admission gate that records portal container
  listener intent without enabling public portal mount behavior.

## Summary

Added a private portal `preparePortalMount` listener-intent gate. The event
layer now derives the `listenToAllSupportedEvents` registration plan for a
portal container without marking targets, creating listener sets, installing
listeners, or dispatching events. The root bridge consumes an accepted private
portal boundary and records that intent with root/portal metadata while keeping
public portal mounting, listener installation, child reconciliation, container
replacement, resources, events, native/Rust execution, and compatibility claims
blocked.

The gate is private metadata only. It does not mutate real portal containers
or broaden portal child reconciliation.

## Changed Files

- `packages/react-dom/src/events/root-listeners.js`
  - Added private portal prepare-mount listener intent records, hidden payloads,
    target snapshots, and listener-plan summaries.
- `packages/react-dom/src/client/root-bridge.js`
  - Added private root bridge portal prepare-mount listener intent records,
    shell/top-level APIs, validation, payload accessors, capability metadata,
    and exports.
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - Added focused coverage proving the intent plan records 138 portal listener
    intents while installing none.
- `tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
  - Added focused portal gate coverage for the private listener-intent record
    while public portal mounting remains blocked.
- `worker-progress/worker-434-portal-prepare-mount-listener-gate.md`
  - This report.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, the worker
  434 prompt, and worker reports 181, 315, 342, 373, 402, and 412.
- Checked React 19.2.6 source in the local reference clone:
  `preparePortalMount(portalInstance)` calls `listenToAllSupportedEvents`, and
  HostPortal complete work calls it only for a first mount.
- Confirmed existing private portal gates remain layered as boundary, fake-DOM
  commit handoff, fake-DOM mount, and one narrow child update.
- Confirmed the new record does not call `listenToPortalContainerEvents`,
  `listenToAllSupportedEvents`, `markTargetAsListening`, or `addEventListener`.
- No nested agents were used.

## Commands Run

```sh
create_goal
get_goal
sed -n ... WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n ... worker-progress/worker-181-react-dom-create-portal-object.md
sed -n ... worker-progress/worker-315-dom-portal-private-root-boundary-records.md
sed -n ... worker-progress/worker-342-dom-portal-private-commit-boundary.md
sed -n ... worker-progress/worker-373-portal-private-fake-dom-mount-gate.md
sed -n ... worker-progress/worker-402-portal-private-child-reconciliation-gate.md
sed -n ... worker-progress/worker-412-private-root-output-gate-docs-and-smoke-refresh.md
rg -n ... packages/react-dom/src/client/root-bridge.js packages/react-dom/src/events
rg -n "preparePortalMount|listenToAllSupportedEvents" /Users/user/Developer/Developer/react-reference/packages
node --check packages/react-dom/src/events/root-listeners.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-create-portal-local-gate.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-create-portal-local-gate.test.mjs
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-dom
git diff --check
```

## Verification

- JS syntax checks passed for all touched JS/MJS files.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 20/20 tests.
- `node --test tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`:
  passed, 9/9 tests.
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`:
  passed with 5 portal root-render rows still blocked and 0 failures.
- `npm run check --workspace @fast-react/react-dom`: passed, including package
  tests and entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check`: passed after adding this report.

## Risks Or Blockers

- No blockers remain.
- The new gate records listener intent only. It does not prove real browser DOM
  listener behavior, event propagation, public portal mounting, or React DOM
  compatibility.
- The intent counts follow the current private event registry and existing root
  listener marker state; if the event list changes, the focused assertions
  should be updated with that admission change.

## Recommended Next Tasks

1. Add a reversible private portal listener installation/cleanup gate only
   after intent records are stable.
2. Keep public portal root-render rows blocked until portal mounting, listener
   setup, child reconciliation, container mutation, resources, events, and
   public root behavior are proven together.
3. Add cleanup/revert records for portal fake-DOM diagnostics if future tests
   reuse shared portal containers.
