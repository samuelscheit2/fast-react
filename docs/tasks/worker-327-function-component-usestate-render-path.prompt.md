# Worker 327: Function Component useState Render Path

Objective: move the private `useState` hook metadata path from canary records
to a narrow function-component render path that mounts and updates state from
the hook list and queue while preserving dispatcher fail-closed boundaries.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 158, 192, 200, 223, 278, 299, and
300.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/begin_work.rs`, focused Rust tests, and
`worker-progress/worker-327-function-component-usestate-render-path.md`.

Do not alter JS public hook facades or React package exports.

Verification: run `cargo fmt --all --check`, focused function-component hook
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
