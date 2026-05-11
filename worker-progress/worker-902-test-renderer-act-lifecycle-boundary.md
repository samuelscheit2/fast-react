# Worker 902 - Test Renderer Act Lifecycle Boundary

## Status

- Complete.

## Summary

- Added a private act/update lifecycle boundary record to the package root and
  both CJS test-renderer entrypoints.
- Added package-root private bridge consumer parity for
  `describePrivateActUpdateLifecycleBoundary`,
  `canConsumePrivateActUpdateLifecycleBoundary`, and
  `consumePrivateActUpdateLifecycleBoundary`, matching the CJS hidden bridge
  surface while staying fail-closed.
- Hardened the CJS private act native-update passive-drain diagnostic so it
  only accepts after consuming:
  - source-owned create/latest-update/unmount lifecycle execution evidence,
  - source-owned update native bridge admission from the same root/request, and
  - a package-created finished-work/current host-output identity result.
- Registered private serialization finished-work identity results in a
  package-local `WeakSet` so cloned or caller-shaped identity rows are rejected.
- Kept public act, public Scheduler flushing, public update behavior,
  serialization, native bridge loading/execution, and package compatibility
  claims blocked.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-902-test-renderer-act-lifecycle-boundary.md`

## Commands Run

- `node --check packages/react-test-renderer/index.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- Positive CJS development coverage now builds real create, update, and unmount
  source-owned execution rows, creates the update finished-work identity while
  the update is current, accepts lifecycle evidence after unmount, and then
  admits the private act update/passive-drain diagnostic through the new
  boundary.
- Negative coverage rejects missing lifecycle evidence, cloned lifecycle
  evidence, raw serialization-shaped identity input, public act strings, and
  caller-shaped native update result clones before the act diagnostic can claim
  update/native/host-output consumption.
- The act oracle now asserts the new accepted worker list, root flush record,
  helper metadata, and four-argument passive-drain rejection path requiring
  source-owned lifecycle/finished-work inputs.
- Package-root coverage now exercises the hidden bridge consumer path and
  rejects public act strings, package-root rows without source-owned host
  output/native update admission, and cross-entrypoint CJS rows.
- CJS production and package-root surfaces expose the same private boundary
  metadata but remain unable to claim the act/update lifecycle boundary without
  the full source-owned lifecycle and finished-work evidence chain.

## Risks Or Blockers

- The boundary is intentionally diagnostic-only. It does not execute public
  `act`, public Scheduler queues, public updates, public serialization, native
  addon loading, or broad renderer compatibility.
- This overlaps with adjacent test-renderer package-root/CJS gate work; merge
  conflicts may need careful parity reconciliation.

## Recommended Next Tasks

- If a future worker promotes CJS production create host-output source records,
  extend the positive act/update lifecycle boundary coverage to production.
- Keep future act diagnostics behind the same source-owned lifecycle and
  finished-work identity checks before adding any broader public behavior.
