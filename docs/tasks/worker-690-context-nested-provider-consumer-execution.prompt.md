# Worker 690: Context Nested Provider Consumer Execution

Objective: implement private Rust evidence that nested context providers update the correct consumer subtree while preserving outer provider values and blocked public compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-reconciler/src/context.rs`, `crates/fast-react-reconciler/src/begin_work.rs`, context-focused Rust tests, and `worker-progress/worker-690-context-nested-provider-consumer-execution.md`.

Constraints: do not edit hook queues, Suspense, Offscreen, React package JS, or conformance oracles. If a shared begin-work helper changes, document the exact interaction.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler --all-features context begin_work -- --nocapture` split into valid Cargo filters if needed, conflict-marker scan, and `git diff --check`.
