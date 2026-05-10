# Worker 659: Layout Effect Destroy Create Commit Execution

Objective: add a private commit-phase layout effect execution gate for one update path, proving destroy-before-create ordering and error capture metadata without opening public layout effect behavior.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`, `crates/fast-react-reconciler/src/root_commit.rs`, focused Rust tests, and `worker-progress/worker-659-layout-effect-destroy-create-commit-execution.md`.

Keep separate from passive effects, refs, React DOM/test-renderer public APIs, and scheduler queues.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler layout function_component root_commit -- --nocapture`, and `git diff --check`.
