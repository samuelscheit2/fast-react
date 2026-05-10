# Worker 397: React DOM Event Invocation From Private Root Output

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Connect the private event listener
  invocation path to private root host-output component-tree metadata so a fake
  click dispatch can prove capture and bubble ordering without public event
  compatibility.
- Final goal status after verification: `complete`; `update_goal` reported
  552 seconds used.

## Summary

Connected the private React DOM event invocation canary to private root
host-output component-tree metadata. The component-tree module can now produce
a private root host-output event-target record from the hidden root bridge
host-output payload, validating that the fake host node is mounted and owned by
the same private root.

The plugin event system now has a private dispatch-queue invocation canary that
walks dispatch records in processing order and invokes hidden listener payloads
without creating SyntheticEvents or enabling public dispatch. Root listener
internals now provide an explicit fake click canary that uses the already
registered private root listener shells in capture-then-bubble order, then
feeds those dispatch records to the queue canary.

A focused conformance test builds a private root bridge initial host-output
tree with `onClickCapture` and `onClick`, dispatches a fake click through the
private helper, and proves listener call order is capture before bubble while
public event compatibility, SyntheticEvent construction, and public root
behavior remain blocked.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
  - Added private root host-output event-target records and payload accessors.
  - Validates mounted host-output target ownership through existing
    component-tree host instance metadata.
- `packages/react-dom/src/events/plugin-event-system.js`
  - Added private dispatch-queue invocation canary records.
  - Processes listener records in existing dispatch-entry processing order,
    still without SyntheticEvent or public dispatch claims.
- `packages/react-dom/src/events/root-listeners.js`
  - Added private fake click dispatch canary from root listener registration
    records and root host-output event-target metadata.
  - Keeps installed root listener shells inert unless the explicit private
    helper is called.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Added root bridge host-output fake click coverage proving capture then
    bubble ordering from latest props in component-tree metadata.
- `worker-progress/worker-397-react-dom-event-invocation-from-private-root-output.md`
  - This report.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read required available worker reports for workers 170, 245, 293, 337, and
  370. Worker 395 report was not present in this worktree.
- Inspected current private component-tree host instance token/latest props
  helpers, root bridge initial host-output payloads, private root listener
  registration payloads, and plugin dispatch listener canary code.
- Confirmed existing event dispatch records already resolve listener metadata
  from component-tree latest props and that dispatch queue entries already hold
  capture processing order as root-to-target and bubble order as
  target-to-root.
- Spawned two read-only explorer agents for component-tree and event-system
  context, but neither returned before the work was complete; both were closed
  and did not affect the implementation or conclusions.

## Commands Run

```sh
create_goal
get_goal
pwd && rg --files | sed -n '1,120p'
git status --short
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
find worker-progress -maxdepth 1 -type f \( -name 'worker-170*.md' -o -name 'worker-245*.md' -o -name 'worker-293*.md' -o -name 'worker-337*.md' -o -name 'worker-370*.md' -o -name 'worker-395*.md' \) -print
sed -n '1,240p' worker-progress/worker-170-dom-event-priority-shell.md
sed -n '1,260p' worker-progress/worker-245-dom-ref-callback-commit-gate.md
sed -n '1,280p' worker-progress/worker-293-root-commit-host-parent-placement-apply-canary.md
sed -n '1,260p' worker-progress/worker-337-react-dom-root-private-create-render-admission.md
sed -n '1,300p' worker-progress/worker-370-react-dom-event-listener-invocation-private.md
sed -n '1,320p' packages/react-dom/src/client/component-tree.js
sed -n '320,760p' packages/react-dom/src/client/component-tree.js
sed -n '760,1180p' packages/react-dom/src/client/component-tree.js
sed -n '1230,1295p' packages/react-dom/src/client/component-tree.js
sed -n '1,420p' packages/react-dom/src/events/plugin-event-system.js
sed -n '420,920p' packages/react-dom/src/events/plugin-event-system.js
sed -n '920,1320p' packages/react-dom/src/events/plugin-event-system.js
sed -n '1,360p' packages/react-dom/src/events/root-listeners.js
sed -n '360,760p' packages/react-dom/src/events/root-listeners.js
sed -n '1,360p' tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
sed -n '760,1280p' tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
sed -n '1,260p' packages/react-dom/src/client/root-bridge.js
sed -n '260,620p' packages/react-dom/src/client/root-bridge.js
sed -n '620,1080p' packages/react-dom/src/client/root-bridge.js
sed -n '1080,1660p' packages/react-dom/src/client/root-bridge.js
sed -n '1660,2400p' packages/react-dom/src/client/root-bridge.js
sed -n '3280,3535p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '2880,2975p' packages/react-dom/src/client/root-bridge.js
sed -n '3900,3975p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '420,620p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
rg -n "applyPrivateInitialRenderHostOutput|rootInitialHostOutputHandoffPayloads|getPrivate.*HostOutput|HostOutput.*Payload|rootHostOutputUpdateHandoffPayloads|get.*HostOutput.*Payload|module.exports" packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/client/component-tree.js
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/events/root-listeners.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node tests/smoke/react-dom-component-tree-map-shell.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node tests/smoke/react-dom-private-root-bridge-shell.mjs
node tests/smoke/import-entrypoints.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
```

## Verification Results

- JS syntax checks passed for touched source and test files.
- Focused event dispatch skeleton passed: 14 tests.
- Event priority shell passed: 7 tests.
- Root listener installation oracle passed: 15 tests.
- Container listener shell smoke passed.
- Component-tree map shell smoke passed.
- Private root bridge focused package test passed: 16 tests.
- Private root bridge smoke passed.
- Import-entrypoint smoke passed.
- `npm run check --workspace @fast-react/react-dom` passed with 37 package
  tests plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- This intentionally invokes private JS listener values only through explicit
  private canary helpers. Installed root listener shells still return
  `undefined` and do not invoke listeners by themselves.
- The queue canary creates per-listener private canary event objects, not
  SyntheticEvents. It does not implement propagation stopping,
  `preventDefault`, hydration replay, controlled restore, portal retargeting,
  root error reporting, browser DOM dispatch compatibility, or public root
  event behavior.
- The root host-output target record validates the current fake DOM
  component-tree metadata shape. Future broader host-output shapes may need a
  more general nearest-host-parent/target selection helper.

## Recommended Next Tasks

1. Add a separate private SyntheticEvent shape gate before any broader dispatch
   queue processing is considered.
2. Add propagation-stop and listener-error routing diagnostics behind private
   helpers before using queue invocation canaries across larger trees.
3. Add portal and nested-root retargeting diagnostics before private event
   invocation canaries cross root boundaries.
