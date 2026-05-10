# Worker 328: Function Component useReducer Eager Update Path

Objective: advance private `useReducer` render/update handling, including
eager state metadata and skipped-lane rebasing, without broad hook
compatibility or public dispatcher claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 158, 192, 200, 223, 278, 299, 300,
and 327 if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-core/src/hook_state_queue.rs`, focused Rust tests, and
`worker-progress/worker-328-function-component-usereducer-eager-update-path.md`.

Do not modify React JS package files except if a focused private conformance
guard is strictly necessary.

Verification: run `cargo fmt --all --check`, focused reducer/state queue tests,
`cargo test -p fast-react-core --all-features`, `cargo test -p
fast-react-reconciler --all-features`, and `git diff --check`.
