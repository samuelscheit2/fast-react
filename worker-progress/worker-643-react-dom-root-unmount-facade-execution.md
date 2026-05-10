# Worker 643: React DOM Root Unmount Facade Execution

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- Initial `get_goal` status: `active`.
- Initial `get_goal` objective: Advance React DOM root.unmount private facade
  execution to clear accepted fake-DOM host output and root metadata, while
  public unmount compatibility remains blocked.
- Final `get_goal` status before this report: `active`.
- Final `get_goal` objective matched this worker objective.

## Summary

- Wired the private react-dom/client facade root `unmount()` method to consume
  an active accepted fake-DOM host-output render and route it through the
  existing private unmount cleanup bridge.
- Added root facade unmount metadata cleanup that marks the initial host-output
  handoff inactive and clears the root handle's current create/render admission
  metadata after cleanup.
- Reused the existing public-facade host-output unmount cleanup diagnostic for
  both the one-shot `adapter.unmountHostOutput(...)` helper and the new
  `renderHostOutput(...); root.unmount()` execution path.
- Kept public `react-dom/client.createRoot`, public root objects, public
  `root.unmount`, native/Rust execution, browser DOM compatibility, and
  compatibility claims blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-643-react-dom-root-unmount-facade-execution.md`

## Commands Run And Results

- `node --check packages/react-dom/src/client/root-bridge.js` - passed.
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - passed.
- `node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs` - passed.
- `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - passed.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - passed, 42 tests.
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - passed, 5 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed, 24 tests.
- `npm run check --workspace @fast-react/react-dom` - passed, 126 package tests plus import-entrypoint smoke. npm printed the existing `minimum-release-age` warning.
- `git diff --check` - passed after writing this report.

## Evidence Gathered

- Read `WORKER_BRIEF.md` immediately after goal setup.
- Inspected the private root bridge unmount path, DOM container cleanup
  metadata, mutation cleanup record, private public-facade adapter, and focused
  shell/conformance tests.
- Reviewed relevant prior worker reports: 369, 380, 486, 511, 512, 578, and
  615.
- Confirmed the previous one-shot `adapter.unmountHostOutput(...)` diagnostic
  already cleared fake-DOM children, but a root with active
  `renderHostOutput(...)` output only recorded `root.unmount()` and left active
  facade host-output/root admission metadata.
- Added focused package and conformance assertions proving `root.unmount()`
  clears the fake-DOM container, detaches component-tree/latest-props metadata,
  marks the host-output handoff inactive, clears root admission metadata, and
  keeps public unmount compatibility false.

## Risks Or Blockers

- The new execution path remains private fake-DOM evidence only. It does not
  prove public React DOM root unmount behavior, browser DOM mutation
  compatibility, Scheduler/native/Rust execution, hydration, events, refs, or
  effects.
- The facade `root.unmount()` cleanup depends on an active host-output render
  diagnostic. Record-only private facade renders still only produce inert
  request metadata.
- No nested agents were used.

## Recommended Next Tasks

- Add a separate private gate for ref/passive unmount ordering when those
  execution paths are ready.
- Keep public root unmount rows blocked until public createRoot/render/unmount
  run through accepted runtime scheduling, commit, cleanup, and browser DOM
  behavior.
