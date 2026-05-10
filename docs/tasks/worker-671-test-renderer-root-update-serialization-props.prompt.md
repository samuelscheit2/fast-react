# Worker 671: Test Renderer Root Update Serialization Props

Objective: broaden private test-renderer update serialization evidence from text-only updates to one HostComponent prop plus text update, keeping public `toJSON()` and `toTree()` blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, serialization conformance tests, and `worker-progress/worker-671-test-renderer-root-update-serialization-props.md`.

Coordinate with worker 667 by staying on update serialization payload shape, not `toTree` native execution.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features json update -- --nocapture`, `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`, `npm run check --workspace @fast-react/react-test-renderer`, and `git diff --check`.
