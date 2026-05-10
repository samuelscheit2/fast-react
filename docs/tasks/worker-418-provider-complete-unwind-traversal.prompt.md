# Worker 418: Provider Complete/Unwind Traversal Canary

Objective: add a private Provider-aware complete/unwind traversal canary that
proves context provider stack restoration for a narrow HostRoot subtree.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 180, 222, 300, 350, 386, 387, and 409
if present.

Write scope: `crates/fast-react-reconciler/src/begin_work.rs`,
`crates/fast-react-reconciler/src/complete_work.rs`,
`crates/fast-react-reconciler/src/root_work_loop.rs`, focused provider/context
tests, and `worker-progress/worker-418-provider-complete-unwind-traversal.md`.

Do not add array/key/portal/Suspense traversal, public context compatibility, or
renderer-visible output claims.

Verification: run `cargo fmt --all --check`, focused begin/complete/root work
loop tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
