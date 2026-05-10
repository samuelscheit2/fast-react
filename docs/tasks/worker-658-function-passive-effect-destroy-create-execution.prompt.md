# Worker 658: Function Passive Effect Destroy Create Execution

Objective: connect private function-component passive effect update metadata to an execution gate that runs one accepted destroy/create pair in React order under test control, while public passive effect compatibility remains blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`, `crates/fast-react-reconciler/src/passive_effects.rs`, `crates/fast-react-reconciler/src/root_commit.rs`, focused Rust tests, and `worker-progress/worker-658-function-passive-effect-destroy-create-execution.md`.

Do not change layout effects, deleted-subtree cleanup, React DOM act, or scheduler public behavior.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler passive function_component destroy create -- --nocapture`, and `git diff --check`.
