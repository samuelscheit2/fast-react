# Worker 668: Test Renderer TestInstance Native Query Execution

Objective: connect private TestInstance query diagnostics to accepted native create/update execution records for one minimal HostComponent query path, keeping public `.root` and TestInstance compatibility blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, conformance tests under `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, and `worker-progress/worker-668-test-renderer-testinstance-native-query-execution.md`.

Avoid toJSON/toTree/act changes except for shared metadata assertions needed by this query path.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features test_instance -- --nocapture`, `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, `npm run check --workspace @fast-react/react-test-renderer`, and `git diff --check`.
