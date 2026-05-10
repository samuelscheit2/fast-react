# Worker 373: Portal Private Fake DOM Mount Gate

## Goal State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active objective from `get_goal`: Extend the private portal commit boundary
  from metadata-only to a fake-DOM mount diagnostic for an explicit portal
  HostComponent/HostText child, while keeping public portal mounting blocked.

## Summary

Extended the private React DOM portal commit boundary with a new fake-DOM mount
diagnostic layered after the existing portal commit handoff. The diagnostic
requires the caller to pass the exact `portal.children` value as an explicit
HostComponent child with a primitive HostText `props.children`, creates a fake
HostComponent and HostText through the fake document factories, and appends the
component into the portal container through the private DOM mutation adapter.

The existing portal commit handoff remains record-only and blocked. Public
`createPortal` root mounting remains blocked: public root rows still report 0
admitted rows and 5 blocked portal rows in the root-render E2E conformance
gate. The new diagnostic explicitly keeps portal child reconciliation,
container replacement, `preparePortalMount`, listener installation, resource
side effects, native/reconciler execution, events, hydration, and compatibility
claims blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
  - Added `createPortalFakeDomMountDiagnostic` shell/top-level APIs, record
    type, hidden payload helpers, accepted/blocked capability metadata, fake
    DOM target validation, explicit child validation, and fake HostComponent /
    HostText append behavior.
- `packages/react-dom/src/shared/create-portal.js`
  - Clarified the unsupported implementation error so the public portal
    mounting blocker remains explicit.
- `packages/react-dom/src/resource-form-gates.js`
  - Added a blocked resource/form boundary for private portal fake-DOM mount
    diagnostics while allowing the fake-DOM mutation evidence to remain
    separate from resource, form, and listener side effects.
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - Added focused private root bridge coverage for the explicit HostComponent /
    HostText portal mount diagnostic and fake-DOM evidence.
- `tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
  - Added local gate coverage proving the private diagnostic is narrow and
    public portal mounting stays blocked.
- `worker-progress/worker-373-portal-private-fake-dom-mount-gate.md`
  - This report.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 181, 315, 342, and 352.
- Worker 367's report was not present in this checkout, so no accepted worker
  367 state was assumed.
- Inspected the current portal boundary and commit handoff in
  `root-bridge.js`, public portal object helper behavior in `create-portal.js`,
  the resource/form portal handoff gate, focused portal tests, and the existing
  private DOM mutation adapter for HostText creation/appending.
- Spawned two read-only explorer agents for root-bridge and portal-gate
  context. They did not return substantive summaries before implementation and
  were closed; they did not affect conclusions.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `sed` reads for required docs, prior reports, root bridge, shared portal,
    resource/form gate, portal tests, and DOM host mutation helpers.
  - `rg` scans for portal, fake-DOM, HostComponent, HostText, resource, and
    commit handoff references.
  - `git status --short`
  - Targeted `git diff` review of touched files.
- Syntax checks:
  - `node --check packages/react-dom/src/client/root-bridge.js`
  - `node --check packages/react-dom/src/shared/create-portal.js`
  - `node --check packages/react-dom/src/resource-form-gates.js`
  - `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `node --check tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
- Focused tests:
  - `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `node --test tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
- Required workspace check:
  - `npm run check --workspace @fast-react/react-dom`

## Verification Results

- All syntax checks passed.
- Focused private root bridge package test passed: 9/9 tests.
- Focused portal local conformance test passed: 7/7 tests.
- Focused resource/form package gate passed: 15/15 tests.
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  passed with 0 public admitted rows, 20 public blocked rows, 18 private bridge
  request rows compared, 2 private bridge rows blocked, 8 private host-output
  diagnostics admitted, 12 private host-output diagnostics blocked, 4 portal
  prerequisites accepted, 5 portal rows blocked, and 0 failures.
- `npm run check --workspace @fast-react/react-dom` passed with 27 package
  tests and import smoke.
- NPM emitted the existing `minimum-release-age` warning during npm commands;
  it did not fail verification.

## Risks Or Blockers

- The new mount diagnostic mutates only caller-supplied fake DOM objects through
  an explicit private API. It does not prove browser DOM behavior or public
  `react-dom/client` portal rendering.
- The diagnostic accepts only one narrow HostComponent with primitive HostText.
  Arrays, nested children, multiple children, and generic portal child
  reconciliation remain blocked.
- There is no reversible cleanup API for the fake-DOM diagnostic. The current
  tests use isolated fake containers; a later broader diagnostic should add
  cleanup if it shares long-lived fake DOM state.

## Recommended Next Tasks

1. Add a separate private portal listener/`preparePortalMount` admission gate
   with reversible listener cleanup before allowing any listener side effects.
2. Keep public portal root-render rows blocked until public roots, portal child
   reconciliation, container replacement, listener setup, resource effects,
   events, and browser DOM behavior are all proven together.
3. Add a cleanup record if future portal fake-DOM diagnostics need to run
   repeatedly against shared containers.
