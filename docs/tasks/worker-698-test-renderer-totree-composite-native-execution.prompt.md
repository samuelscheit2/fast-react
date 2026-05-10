# Worker 698: Test Renderer toTree Composite Native Execution

Objective: add private react-test-renderer `toTree` native execution evidence for a FunctionComponent-above-host output shape, preserving blocked public `toTree()`.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`, `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, and `worker-progress/worker-698-test-renderer-totree-composite-native-execution.md`.

Constraints: do not edit React DOM, Scheduler, production CJS, or unrelated test-renderer error/act surfaces. Keep metadata private and deterministic.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features to_tree tree -- --nocapture` split into valid Cargo filters if needed, focused serialization/create-routing conformance, conflict-marker scan, and `git diff --check`.
