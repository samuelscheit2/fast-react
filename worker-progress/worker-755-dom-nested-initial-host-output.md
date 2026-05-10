# Worker 755: DOM Nested Initial Host Output

## Summary

- Added a private `nested-host-component` initial host-output shape for the
  bridge-owned root-render diagnostic.
- The private path now mounts `HostComponent > HostComponent > HostText` into
  fake DOM, keeps stable parent/child/text host tokens, and publishes latest
  props for both HostComponent nodes only after fake-DOM mutation succeeds.
- Direct private `renderRootHostOutput` consumes accepted root work-loop
  finished-work metadata for the nested child tag path and keeps public root,
  native, reconciler, hydration, event, ref, browser DOM, and compatibility
  claims blocked.
- Fixed audit finding: partial nested initial-output rollback now detaches every
  non-null created parent, child, and text node instead of stopping after the
  first available branch.
- Added private package and root-render E2E conformance coverage for the nested
  initial host-output diagnostic, including a mid-commit nested append failure.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-755-dom-nested-initial-host-output.md`

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "nested fake-DOM|root render host-output"`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "nested host-output"`
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs --test-name-pattern "nested initial host output|private facade root.render fake-DOM"`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" packages/react-dom/src/client/root-bridge.js packages/react-dom/test/react-dom-private-root-bridge-shell.test.js tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`

## Evidence

- Root bridge package test now proves `renderRootHostOutput` creates one fake
  `SECTION` parent, one fake `SPAN` child, and one HostText node for accepted
  nested metadata.
- Root bridge package test now forces a failure while appending the nested
  child HostComponent to the parent after parent/child latest props and text
  attachment have already happened. The regression proves the container is
  empty, parent/child/text fake nodes have no parent or children, component-tree
  ownership is cleared, and latest props for all three nodes read `null`.
- The hidden initial host-output payload exposes stable parent, child, and text
  tokens; each token resolves back to the expected fake node before cleanup.
- Latest props are published for the parent and child HostComponent nodes, while
  HostText latest props remain `null`.
- Cleanup removes only the root child from the container and detaches three host
  instances from the component tree.
- Root-render E2E conformance proves the nested diagnostic remains private and
  leaves public `react-dom/client.createRoot` blocked with
  `FAST_REACT_UNIMPLEMENTED`.
- `npm run check --workspace @fast-react/react-dom` passed 159 package tests
  plus import smoke. `npm` emitted the existing `minimum-release-age` warning.
- Package surface guard, standalone import smoke, whitespace check, and
  conflict-marker scan passed. The marker scan exited `1` because no matches
  were found.

## Risks Or Blockers

- No blockers.
- This admits only the one-level private fake-DOM shape
  `HostComponent > HostComponent > HostText` for initial root output. Nested
  fragment/array shapes, multi-child nested trees, public root execution,
  hydration, event dispatch, refs, native bridge execution, browser DOM
  compatibility, and package compatibility remain blocked.
- The DOM host mutation gate metadata lives outside this worker's write scope,
  so this worker records the nested admission in root-bridge capabilities rather
  than updating dom-host metadata rows.

## Recommended Next Tasks

- Add private event ordering evidence for parent/child nested root output if a
  later worker needs delegated event paths across the nested fake-DOM tree.
- Add separate fake-DOM placement/delete/update evidence before admitting
  broader nested child reconciliation.
- Keep public React DOM root/render/hydration/native compatibility blocked until
  browser DOM, scheduler, refs/effects, events, hydration, and native execution
  are all oracle-backed.
