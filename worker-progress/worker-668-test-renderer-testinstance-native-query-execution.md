# Worker 668: Test Renderer TestInstance Native Query Execution

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from latest `get_goal`: `active`.
- Active goal objective from latest `get_goal`: connect private TestInstance
  query diagnostics to accepted native create/update execution records for one
  minimal HostComponent query path, keeping public `.root` and TestInstance
  compatibility blocked.

## Summary

- Added Rust private TestInstance native-query execution evidence for create
  and update. The evidence validates the accepted create native host-output
  handoff or update native-bridge admission, then ties it to the existing
  `findByType` HostComponent query preflight.
- Added Rust stale/public-compatibility rejection for the new TestInstance
  native-query evidence path.
- Extended the CJS development private TestInstance wrapper with a hidden
  helper that consumes accepted `FastReactTestRendererPrivateRootExecutionResult`
  create/update records and returns private HostComponent query evidence.
- Kept public `.root`, TestInstance query methods, native bridge availability,
  native execution, and compatibility claims blocked.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-668-test-renderer-testinstance-native-query-execution.md`

## Verification

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`: passed.
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: passed.
- `cargo fmt --all`: applied formatting.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features test_instance -- --nocapture`: passed, 8 focused tests. Existing `fast-react-reconciler` warnings were emitted.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: passed, 26 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed. npm printed the existing `minimum-release-age` warning.
- `git diff --check`: passed.

## Evidence Gathered

- Inspected the existing Rust TestInstance findAll/findBy/query-bridge
  diagnostics and the create/update native bridge admission records.
- Inspected the CJS private root execution bridge and the existing private
  toJSON native-execution evidence path for validation shape.
- Spawned one explorer subagent to summarize the scoped Rust/CJS/test paths;
  it confirmed the missing link was between TestInstance query diagnostics and
  `FastReactTestRendererPrivateRootExecutionResult` consumption.

## Notes

- An initial conformance run failed because I briefly widened shared
  `rustCanaryMetadata.testInstanceQuery.acceptedWorkers`, which production CJS
  does not expose in this worker's scope. I corrected that by keeping the new
  worker metadata on the private development wrapper gate only.
- No public TestInstance object or query method is materialized by this change.
