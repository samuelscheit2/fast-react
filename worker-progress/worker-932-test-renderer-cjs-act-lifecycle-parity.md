# Worker 932 - Test Renderer CJS Act Lifecycle Parity

## Status

- Complete.

## Summary

- Extended the CJS production private root bridge to expose and consume
  source-owned create-route admission and create native host-output handoff
  evidence.
- CJS production can now build the same create/update/unmount source-owned
  lifecycle chain needed by the private act/update lifecycle boundary and
  passive-drain diagnostic.
- Kept public `act`, public update behavior, public Scheduler flushing,
  serialization behavior, native addon loading/execution, and compatibility
  claims blocked.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-932-test-renderer-cjs-act-lifecycle-parity.md`

## Evidence

- CJS production now accepts the private route:
  `getRootCreateRouteAdmission` ->
  `consumePrivateCreateNativeBridgeHostOutputHandoff` ->
  `executeRootRequest(create)` ->
  `consumePrivateRootLifecycleExecutionEvidence(create/update/unmount)` ->
  `describePrivateActUpdateLifecycleBoundary` /
  `consumeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata`.
- The create-routing gate now runs the private act/update lifecycle boundary
  positive path for both CJS development and CJS production.
- Added negatives for cloned/stale lifecycle rows, production rows crossing into
  CJS development/package root, public update/act/Scheduler compatibility
  claims, scheduler-shaped lifecycle smuggling, and package/CJS parity drift.

## Commands Run

- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- The new production route is still private diagnostic plumbing. It does not
  run public `act`, drain public Scheduler queues, execute public updates,
  expose public serialization, load native addons, or claim renderer/package
  compatibility.
- CJS production and development still differ in accepted native update
  admission detail: development rejects production act lifecycle rows earlier
  on production's reduced admission evidence shape.
- Overlap risk is limited to adjacent react-test-renderer CJS/private lifecycle
  work.

## Recommended Next Tasks

- Decide whether CJS production should grow the development-only update
  admission detail fields or keep the current reduced production evidence
  shape.
- Continue public `act` work only after Scheduler queue flushing, public root
  routing, passive effect callback execution, and renderer compatibility are
  independently admitted.
