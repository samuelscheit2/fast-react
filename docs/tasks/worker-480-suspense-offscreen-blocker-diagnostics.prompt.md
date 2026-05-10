# Worker 480: Suspense/Offscreen Blocker Diagnostics

Objective: add private fail-closed diagnostics for Suspense and Offscreen child
shapes encountered during root work-loop and commit preflight.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 117, 314, 441, 452, and 458 if
present.

Write scope: `crates/fast-react-reconciler/src/begin_work.rs`,
`crates/fast-react-reconciler/src/root_work_loop.rs`, focused unsupported
feature tests, and
`worker-progress/worker-480-suspense-offscreen-blocker-diagnostics.md`.

Do not implement Suspense, Offscreen, hydration reveal, or public compatibility.

Verification: run focused unsupported-feature/root-work-loop tests,
`cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all --check`,
and `git diff --check`.
