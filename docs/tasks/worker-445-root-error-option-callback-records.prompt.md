# Worker 445: Root Error Option Callback Records

Objective: add private root error option callback records for render/commit
errors so `onUncaughtError`, `onCaughtError`, and `onRecoverableError` handles
are preserved as metadata without invoking user callbacks.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 161, 389, 416, 421, and 465 if
present.

Write scope: `crates/fast-react-reconciler/src/root_config.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`, focused Rust tests, and
`worker-progress/worker-445-root-error-option-callback-records.md`.

Do not invoke JS callbacks, implement public error boundaries, or claim
recoverable error compatibility.

Verification: run focused root_config/root_commit/root_scheduler tests,
`cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all
--check`, and `git diff --check`.
