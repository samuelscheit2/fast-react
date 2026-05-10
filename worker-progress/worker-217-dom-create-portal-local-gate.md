# Worker 217: DOM CreatePortal Local Gate

## Goal State

- `create_goal` was run before research or file reads.
- `get_goal` was available and returned status: active.
- Active objective recorded from `get_goal`: Tighten the private/public createPortal placeholder against the accepted portal oracle and core portal record shape, preserving fail-closed behavior for unsupported reconciliation/commit paths and avoiding DOM mutation, root scheduling, event bubbling, or compatibility claims.

## Summary

Tightened the shared React DOM `createPortal` helper around an explicit
normalized portal-record boundary. The public root/profiling export still
returns the accepted React DOM 19.2.6 portal object shape, but the private
constructor now accepts only the local DOM placeholder implementation
`null` and normalized `null|string` keys.

Expanded focused portal conformance coverage to pin the remaining accepted
oracle slices: object mutability, direct call/apply/extra-argument/new
invocation behavior, and no DOM mutation/root marker/event-listener side
effects during create-only portal construction.

No reconciler, commit, DOM mutation, root bridge, event bubbling, package
compatibility claim, or master document behavior was changed.

## Changed Files

- `packages/react-dom/src/shared/create-portal.js`
  - Added a private `createPortalRecordFromNormalizedParts` boundary mirroring
    the core portal record's normalized key, children, container-info, and
    implementation parts.
  - Added `normalizePortalKey`, preserving React DOM key coercion and Symbol
    warning/throw behavior.
  - Added fail-closed private errors for unnormalized keys and non-null portal
    implementations.
  - Kept public `createPortal` shape and object property order aligned with
    the accepted React DOM portal oracle.
- `tests/conformance/test/react-dom-create-portal-object.test.mjs`
  - Added private record-shape and fail-closed tests.
  - Added accepted portal object mutability and invocation-boundary checks.
  - Added a create-only side-effect test that instruments DOM-like mutation,
    listener, and root-marker surfaces.
- `worker-progress/worker-217-dom-create-portal-local-gate.md`
  - This report.

## Evidence Gathered

- `WORKER_BRIEF.md` confirmed first-action goal setup, scoped worker rules,
  report requirements, and verification commands.
- `MASTER_PLAN.md` lists Worker 217 as the active DOM createPortal local gate.
- `MASTER_PROGRESS.md` records Worker 181 as accepted JS portal object behavior
  and Worker 189 as accepted core portal record foundation.
- Worker 057 report confirms the portal oracle covers public object shape,
  key coercion, valid/invalid containers, unsupported contexts, and invocation
  boundaries, but not rendering, commit, listener setup, or event behavior.
- Worker 181 report confirms public React DOM `createPortal` object behavior
  was implemented with no mounting/listener/commit support.
- Worker 189 report confirms the Rust core record shape is a renderer-agnostic
  portal brand with normalized optional key, children, container-info, and
  implementation handles.
- React reference source confirms the public DOM wrapper validates containers,
  passes `implementation: null`, and delegates to the reconciler portal record
  constructor.

## Completion Audit

- Required context files read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`.
- Required worker reports read: 057, 181, and 189.
- Required implementation files inspected:
  `packages/react-dom/src/shared/create-portal.js`,
  `packages/react-dom/index.js`, `crates/fast-react-core/src/element.rs`, and
  portal oracle source/test files.
- Primary write scope satisfied: only `packages/react-dom/src/shared/create-portal.js`
  changed for implementation.
- Secondary write scope satisfied: only focused portal conformance tests were
  changed.
- Report created at the required path.
- Reconciler, DOM mutation adapter, root bridge, events, and master docs were
  not edited.
- Public root/profiling `createPortal` remains a create-only object helper with
  React DOM oracle key/container/object behavior.
- Private constructor now fails closed for unsupported non-null implementation
  handles and unnormalized keys.
- Tests verify no append/insert/remove/text mutation, no event-listener call,
  and no root marker appears during `createPortal` object construction.
- Checked portal oracle still keeps Fast React compatibility claims false.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `ls worker-progress && rg -n "worker-0?57|worker-181|worker-189|057|181|189" worker-progress MASTER_PROGRESS.md MASTER_PLAN.md`
- `sed -n '1,260p' worker-progress/worker-057-react-dom-portal-oracle.md`
- `sed -n '1,260p' worker-progress/worker-181-react-dom-create-portal-object.md`
- `sed -n '1,260p' worker-progress/worker-189-core-portal-record-foundation.md`
- `rg --files | rg '(portal|create-portal|react-dom).*\\.(js|md|rs|json)$'`
- `sed -n '1,240p' packages/react-dom/src/shared/create-portal.js`
- `sed -n '1,220p' packages/react-dom/index.js`
- `sed -n '1,260p' packages/react-dom/profiling.js`
- `sed -n '1,680p' crates/fast-react-core/src/element.rs`
- `sed -n '1,620p' tests/conformance/test/react-dom-create-portal-object.test.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-oracle.mjs`
- `sed -n '1,260p' docs/tasks/worker-217-dom-create-portal-local-gate.prompt.md`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-scenarios.mjs`
- `sed -n '1,760p' tests/conformance/src/react-dom-portal-probe-runner.mjs`
- `sed -n '1,260p' packages/react-dom/src/client/dom-container.js`
- `rg -n "createPortal|portal" tests packages/react-dom worker-progress/worker-2*.md package.json tests/smoke`
- `sed -n '1,260p' tests/smoke/import-entrypoints.mjs`
- `sed -n '1,260p' tests/smoke/react-dom-root-exports.mjs`
- `git status --short --branch`
- `sed -n '1,260p' package.json`
- `sed -n '1,260p' tests/conformance/package.json`
- `sed -n '1,260p' packages/react-dom/placeholder-utils.js`
- `rg -n "function createPortal|createPortal\\(" /Users/user/Developer/Developer/react-reference/packages/react-dom /Users/user/Developer/Developer/react-reference/packages/react-reconciler /Users/user/Developer/Developer/react-reference/packages/shared`
- `sed -n '1,120p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactPortal.js`
- `sed -n '45,85p' /Users/user/Developer/Developer/react-reference/packages/react-dom/src/shared/ReactDOM.js`
- `sed -n '65,100p' /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMClientFB.js`
- `sed -n '60,85p' /Users/user/Developer/Developer/react-reference/packages/shared/ReactTypes.js`
- `sed -n '1,280p' tests/conformance/src/dom-text-content-local-gate.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-resource-hints-unsupported-gates.mjs`
- `sed -n '1,220p' packages/react-dom/src/client/root-markers.js`
- `sed -n '1,260p' packages/react-dom/src/events/root-listeners.js`
- `sed -n '1,220p' packages/react-dom/src/client/root-bridge.js`
- `sed -n '1,260p' packages/react-dom/src/dom-host/mutation.js`
- `node --check packages/react-dom/src/shared/create-portal.js`
- `node --check tests/conformance/test/react-dom-create-portal-object.test.mjs`
- `node --test tests/conformance/test/react-dom-create-portal-object.test.mjs`
- `node --test tests/conformance/test/react-dom-portal-oracle.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/react-dom-root-exports.mjs`
- `npm run check:js`
- `git diff --check`
- `git diff --stat`
- `git diff --name-only`
- `rg -n "createPortalRecordFromNormalizedParts|unsupportedPortalImplementationErrorCode|compatibilityClaimed|createPortal constructs only" packages/react-dom/src/shared/create-portal.js tests/conformance/test/react-dom-create-portal-object.test.mjs tests/conformance/test/react-dom-portal-oracle.test.mjs worker-progress/worker-217-dom-create-portal-local-gate.md`
- `git diff -- packages/react-dom/index.js packages/react-dom/profiling.js crates/fast-react-core/src/element.rs packages/react-dom/src/client/root-bridge.js packages/react-dom/src/dom-host/mutation.js packages/react-dom/src/events/root-listeners.js MASTER_PLAN.md MASTER_PROGRESS.md`

## Verification Results

- `node --check packages/react-dom/src/shared/create-portal.js`: passed.
- `node --check tests/conformance/test/react-dom-create-portal-object.test.mjs`: passed.
- `node --test tests/conformance/test/react-dom-create-portal-object.test.mjs`: passed, 7 tests.
- `node --test tests/conformance/test/react-dom-portal-oracle.test.mjs`: passed, 10 tests.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `node tests/smoke/react-dom-root-exports.mjs`: passed.
- `npm run check:js`: passed, including package surface, smoke, benchmarks,
  workspace checks, and 483 conformance tests.
- `git diff --check`: passed.

## Risks Or Blockers

- This is still a local create-only portal record gate. Portal reconciliation,
  commit mounting, root scheduling, listener installation, event bubbling, and
  rendering remain unsupported by design.
- The private JS record helper is intentionally stricter than React's generic
  reconciler helper for non-null implementations because this package has no
  renderer implementation handle yet.
- No blockers remain for this worker scope.

## Recommended Next Tasks

1. Add portal fiber/reconciler admission only after a separate fail-closed
   worker owns portal fiber creation and unsupported commit behavior.
2. Keep portal listener and event bubbling work separate from object creation,
   with browser or deterministic host evidence before any compatibility claim.
3. Do not admit portal render scenarios into root E2E gates until host commit
   and event prerequisites are explicitly green.

## Nested Agents

- Spawned explorer `/root/portal_gate_review` for a read-only review of likely
  gaps, but it did not return findings before timeout and was closed. It did
  not affect implementation or conclusions.
