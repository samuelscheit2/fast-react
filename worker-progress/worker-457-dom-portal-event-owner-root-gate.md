# Worker 457: DOM Portal Event Owner-Root Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add a private portal event ownership
  gate that records how portal children attach to an owner root for event path
  diagnostics without enabling public portal bubbling.
- `update_goal(status: "complete")` succeeded after implementation and
  verification. Final reported time used: 562 seconds.

## Summary

Added a private portal event owner-root gate layered after the existing
private portal fake-DOM mount diagnostic. The root bridge validates that the
mounted portal HostComponent and HostText tokens are still attached, owned by
the source private root, and still present in the portal container. It then
creates a component-tree event dispatch path for the portal HostComponent and
records an event-plugin owner-root diagnostic.

The new records are diagnostics only. They do not invoke listeners, install
portal listeners, synthesize events, enable public portal bubbling, mutate DOM
through the gate, run native/Rust/reconciler code, or claim browser DOM
compatibility.

## Changed Files

- `packages/react-dom/src/shared/create-portal.js`
- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `worker-progress/worker-457-dom-portal-event-owner-root-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 181, 344, 373, 402, 430, and 434.
- Checked React 19.2.6 reference event source for portal/root-container event
  retargeting and confirmed this worker should only record private ownership
  evidence, not implement public portal bubbling.
- Confirmed current portal layers remain ordered as public portal object,
  private boundary, prepare-mount listener intent, fake-DOM commit handoff,
  fake-DOM mount, and one-child reconciliation.
- No nested agents were used.

## Commands Run

```sh
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/shared/create-portal.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --check tests/conformance/test/react-dom-create-portal-local-gate.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-create-portal-local-gate.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-dom
git diff --check
```

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Focused private root bridge package test passed: 27/27 tests.
- Focused portal local conformance test passed: 10/10 tests.
- Focused event dispatch plugin conformance test passed: 18/18 tests.
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  passed with 5 portal root-render rows still blocked and 0 failures.
- `npm run check --workspace @fast-react/react-dom` passed with package tests
  and import-entrypoint smoke. npm emitted the existing
  `minimum-release-age` warning.
- `git diff --check` passed after adding this report with intent-to-add.

## Risks Or Blockers

- No blockers remain.
- The gate records private fake-DOM/component-tree owner-root evidence only.
  It does not prove browser DOM propagation, public portal event bubbling,
  portal listener installation, or public `createPortal` rendering.
- The diagnostic currently targets the mounted portal HostComponent path only;
  broader portal trees and HostText/native target retargeting remain blocked.

## Recommended Next Tasks

1. Add a separate private portal listener installation/cleanup gate before any
   reversible portal event listener side effects are admitted.
2. Add a checked portal event bubbling oracle before any public portal event
   compatibility claim.
3. Keep public portal root-render rows blocked until portal mounting,
   listener setup, child reconciliation, container mutation, resource effects,
   and event propagation are proven together.
