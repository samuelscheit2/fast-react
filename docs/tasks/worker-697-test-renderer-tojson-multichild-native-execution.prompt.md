# Worker 697: Test Renderer toJSON Multi-Child Native Execution

Objective: add private react-test-renderer `toJSON` native execution evidence for multi-child and sibling text host output rows, without enabling public `toJSON()`.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`, `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, and `worker-progress/worker-697-test-renderer-tojson-multichild-native-execution.md`.

Constraints: stay within private diagnostics; do not change public package keys, production CJS, React DOM, or Scheduler. Keep shape validation strict and fail-closed.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features to_json -- --nocapture` or valid nearby filters, `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`, `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, conflict-marker scan, and `git diff --check`.
