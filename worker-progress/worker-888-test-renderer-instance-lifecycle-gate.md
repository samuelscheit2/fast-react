# Worker 888 - Test Renderer Instance Lifecycle Gate

## Summary

Implemented a private lifecycle gate in `react-test-renderer` package root,
CJS development, and CJS production entrypoints. The private
`fast.react_test_renderer.private_test_instance_wrapper_record` symbol now
exposes a frozen gate record until source-owned create/update/unmount lifecycle
execution evidence is accepted for the current renderer root. Private
TestInstance/query diagnostics are only returned through the private bridge
after that evidence is accepted and remains current.

## Evidence Added

- Source-owned lifecycle execution rows must be frozen records from the current
  entrypoint's root execution WeakSet.
- Accepted lifecycle evidence is recorded per root handle only on real
  consumption, while `canConsume...` remains dry-run.
- Replay consumption is rejected.
- Current-root checks reject stale update rows, stale rows after another
  unmount, and non-current create-request query access.
- Cross-entrypoint package-root/CJS lifecycle rows are rejected.
- Caller-shaped TestInstance query rows are rejected for private query bridge
  preflight consumption.
- Public `.root`, public `ReactTestInstance`, public query methods,
  serialization, act/Scheduler, native bridge availability, and compatibility
  claims remain blocked.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`

## Commands Run

- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `node --check packages/react-test-renderer/index.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `git diff --check`

## Risks Or Blockers

- The private symbol remains a non-enumerable data property to preserve package
  surface smoke expectations; accepted diagnostics are retrieved through the
  private bridge once the lifecycle gate is satisfied.
- Worker 881 may overlap in `react-test-renderer` private diagnostics. This
  change intentionally stays limited to the lifecycle gate and private
  TestInstance/query diagnostic acceptance path.

## Recommended Next Tasks

- If Worker 881 changes the same private TestInstance wrapper shape, reconcile
  on the gate fields and current-root bridge behavior.
- Consider adding a later public-compatibility milestone only after real public
  `.root`/`ReactTestInstance` objects and query traversal are implemented.
