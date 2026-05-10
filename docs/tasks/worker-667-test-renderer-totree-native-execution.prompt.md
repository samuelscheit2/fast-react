# Worker 667: Test Renderer toTree Native Execution

Objective: add private react-test-renderer `toTree` evidence that consumes accepted native create/update/unmount execution records for the minimal tree, while public `toTree()` compatibility stays blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, `packages/react-test-renderer/cjs/react-test-renderer.production.js` if metadata parity is needed, `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, and `worker-progress/worker-667-test-renderer-totree-native-execution.md`.

Coordinate with toJSON/TestInstance workers by keeping this to `toTree` diagnostics only.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features to_tree -- --nocapture`, `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, `npm run check --workspace @fast-react/react-test-renderer`, and `git diff --check`.
